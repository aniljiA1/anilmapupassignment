import Location from "../models/Location.js";
import axios from "axios";

/** helper: measure time with bigint */
const timeNow = () => process.hrtime.bigint();

const toNs = (start, end) => {
  // both bigint nanoseconds already
  return end - start;
};

// haversine distance in kilometers
function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function createLocation(req, res) {
  const start = timeNow();
  try {
    const { name, address, latitude, longitude, category } = req.body;
    const loc = await Location.create({ name, address, latitude, longitude, category });
    const end = timeNow();
    res.json({ id: loc._id.toString(), time_ns: toNs(start, end).toString() });
  } catch (err) {
    const end = timeNow();
    res.status(500).json({ error: err.message, time_ns: toNs(start, end).toString() });
  }
}

export async function getLocationsByCategory(req, res) {
  const start = timeNow();
  try {
    const { category } = req.params;
    const locations = await Location.find({ category }).lean();
    const mapped = locations.map((l) => ({
      id: l._id.toString(),
      name: l.name,
      address: l.address,
      latitude: l.latitude,
      longitude: l.longitude,
      category: l.category
    }));
    const end = timeNow();
    res.json({ locations: mapped, time_ns: toNs(start, end).toString() });
  } catch (err) {
    const end = timeNow();
    res.status(500).json({ error: err.message, time_ns: toNs(start, end).toString() });
  }
}

export async function searchNearby(req, res) {
  const start = timeNow();
  try {
    const { latitude, longitude, category, radius_km } = req.body;
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      const end = timeNow();
      return res.status(400).json({ error: "latitude and longitude must be numbers", time_ns: toNs(start, end).toString() });
    }
    const rad = Number(radius_km ?? 2);
    // find candidates in DB — basic bounding box optimization:
    const latDelta = rad / 111; // approx degrees per km
    const lonDelta = Math.abs(rad / (111 * Math.cos((latitude * Math.PI) / 180)));
    const minLat = latitude - latDelta;
    const maxLat = latitude + latDelta;
    const minLon = longitude - lonDelta;
    const maxLon = longitude + lonDelta;

    const candidates = await Location.find({
      category,
      latitude: { $gte: minLat, $lte: maxLat },
      longitude: { $gte: minLon, $lte: maxLon }
    }).lean();

    const results = candidates
      .map((c) => {
        const d = haversineKm(latitude, longitude, c.latitude, c.longitude);
        return {
          id: c._id.toString(),
          name: c.name,
          address: c.address,
          distance: Number(d.toFixed(3)),
          category: c.category
        };
      })
      .filter((r) => r.distance <= rad)
      .sort((a, b) => a.distance - b.distance);

    const end = timeNow();
    res.json({ locations: results, time_ns: toNs(start, end).toString() });
  } catch (err) {
    const end = timeNow();
    res.status(500).json({ error: err.message, time_ns: toNs(start, end).toString() });
  }
}

export async function tripCost(req, res) {
  const start = timeNow();
  try {
    const location_id = req.params.location_id;
    const { latitude: fromLat, longitude: fromLon } = req.body;
    if (!fromLat || !fromLon) {
      const end = timeNow();
      return res.status(400).json({ error: "Provide latitude & longitude in body", time_ns: toNs(start, end).toString() });
    }
    const dest = await Location.findById(location_id).lean();
    if (!dest) {
      const end = timeNow();
      return res.status(404).json({ error: "Location not found", time_ns: toNs(start, end).toString() });
    }

    // TollGuru API integration
    const TOLLGURU_API_KEY = process.env.TOLLGURU_API_KEY;
    if (!TOLLGURU_API_KEY) {
      const end = timeNow();
      return res.status(500).json({ error: "TOLLGURU_API_KEY not configured", time_ns: toNs(start, end).toString() });
    }

    // Prepare request body per TollGuru docs (this may vary; adapt if their API changed)
    const body = {
      source: { lat: fromLat, lon: fromLon },
      destination: { lat: dest.latitude, lon: dest.longitude },
      vehicle: { vehicle_type: "car" },
      // optional: include profile
      // profile: process.env.TOLLGURU_PROFILE || "driving-car"
    };

    // TollGuru calc route endpoint (developer may need to adapt if TollGuru changed)
    const resp = await axios.post(
      "https://dev.tollguru.com/v1/calc/route",
      body,
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": TOLLGURU_API_KEY
        }
      }
    );

    // Parse response (structure may differ; handle safely)
    const tg = resp.data || {};
    // Attempt to extract estimated tolls & fuel - this depends on TollGuru's response fields
    // We'll compute a conservative fallback using distance * per-km fuel price if needed
    let total_cost = null, fuel_cost = null, toll_cost = null;

    if (tg && tg.estimated_total) {
      total_cost = tg.estimated_total;
    } else if (tg && tg.total_price && typeof tg.total_price === "number") {
      total_cost = tg.total_price;
    }

    // attempt to pick tolls
    if (tg && typeof tg.tolls_total === "number") toll_cost = tg.tolls_total;
    if (tg && tg.toll_cost && typeof tg.toll_cost === "number") toll_cost = tg.toll_cost;

    // fuel cost fallback: compute distance and use generic per km cost if not provided
    const distance_km = (function () {
      const R = 6371;
      const toRad = (v) => (v * Math.PI) / 180;
      const dLat = toRad(dest.latitude - fromLat);
      const dLon = toRad(dest.longitude - fromLon);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(fromLat)) * Math.cos(toRad(dest.latitude)) * Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    })();

    if (!fuel_cost) {
      // default assumptions — you can override
      const avg_consumption_km_per_l = 12; // km per liter (example)
      const fuel_price_per_l = 1.5; // USD per liter — adjust as needed or pass as param
      fuel_cost = Number(((distance_km / avg_consumption_km_per_l) * fuel_price_per_l).toFixed(2));
    }

    if (!toll_cost) toll_cost = 0;
    if (!total_cost) total_cost = Number((fuel_cost + toll_cost).toFixed(2));

    const end = timeNow();
    res.json({
      total_cost,
      fuel_cost,
      toll_cost,
      distance_km: Number(distance_km.toFixed(3)),
      time_ns: toNs(start, end).toString()
    });
  } catch (err) {
    const end = timeNow();
    // if TollGuru failed, include message
    res.status(500).json({ error: err.response?.data || err.message, time_ns: toNs(start, end).toString() });
  }
}
