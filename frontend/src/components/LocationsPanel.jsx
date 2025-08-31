import React, { useState } from "react";
import { postLocation, getLocationsByCategory, postSearch, postTripCost } from "../api";

export default function LocationsPanel() {
  const [form, setForm] = useState({ name: "", address: "", latitude: "", longitude: "", category: "" });
  const [category, setCategory] = useState("restaurant");
  const [locations, setLocations] = useState([]);
  const [searchParams, setSearchParams] = useState({ latitude: "", longitude: "", category: "cafe", radius_km: 2 });
  const [searchResults, setSearchResults] = useState([]);
  const [tripFrom, setTripFrom] = useState({ latitude: "", longitude: "" });
  const [tripResult, setTripResult] = useState(null);

  async function handleCreate(e) {
    e.preventDefault();
    const payload = {
      name: form.name, address: form.address, latitude: Number(form.latitude), longitude: Number(form.longitude), category: form.category
    };
    try {
      const res = await postLocation(payload);
      alert("Created id: " + res.id);
      setLocations(prev => [...prev, { id: res.id || res._id, ...payload }]);

      setForm({ name: "", address: "", latitude: "", longitude: "", category: "" });
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    }
  }

  async function loadByCategory() {
    try {
      const r = await getLocationsByCategory(category);
      setLocations(r.locations || []);
    } catch (err) {
      alert("Error fetching: " + err.message);
    }
  }

  async function doSearch() {
    try {
      const body = {
        latitude: Number(searchParams.latitude),
        longitude: Number(searchParams.longitude),
        category: searchParams.category,
        radius_km: Number(searchParams.radius_km)
      };
      const r = await postSearch(body);
      setSearchResults(r.locations || []);
    } catch (err) {
      alert("Search error: " + err.message);
    }
  }

  async function calcTrip(id) {
    try {
      const body = { latitude: Number(tripFrom.latitude), longitude: Number(tripFrom.longitude) };
      const r = await postTripCost(id, body);
      setTripResult(r);
    } catch (err) {
      alert("Trip cost error: " + (err.response?.data?.error || err.message));
    }
  }

  return (
    <div className="locations-panel">
      <h3>Locations API</h3>
      <form onSubmit={handleCreate}>
        <input placeholder="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
        <input placeholder="address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
        <input placeholder="latitude" value={form.latitude} onChange={e => setForm({...form, latitude: e.target.value})} required />
        <input placeholder="longitude" value={form.longitude} onChange={e => setForm({...form, longitude: e.target.value})} required />
        <input placeholder="category" value={form.category} onChange={e => setForm({...form, category: e.target.value})} required />
        <button type="submit"> Create</button>
      </form>

      <hr />
      <div>
        <h4>Get by category</h4>
        <input value={category} onChange={e => setCategory(e.target.value)} />
        <button onClick={loadByCategory}>Load</button>
        <ul>
          {locations.map(l => <li key={l.id}>{l.name} — {l.address} ({l.latitude},{l.longitude})</li>)}
        </ul>
      </div>

      <hr />
      <div>
        <h4>Search nearby</h4>
        <input placeholder="latitude" value={searchParams.latitude} onChange={e => setSearchParams({...searchParams, latitude: e.target.value})} />
        <input placeholder="longitude" value={searchParams.longitude} onChange={e => setSearchParams({...searchParams, longitude: e.target.value})} />
        <input placeholder="category" value={searchParams.category} onChange={e => setSearchParams({...searchParams, category: e.target.value})} />
        <input placeholder="radius_km" value={searchParams.radius_km} onChange={e => setSearchParams({...searchParams, radius_km: e.target.value})} />
        <button onClick={doSearch}>Search</button>
        <ul>
          {searchResults.map(s => <li key={s.id}>{s.name} — {s.distance} km</li>)}
        </ul>
      </div>

      <hr />
      <div>
        <h4>Trip cost</h4>
        <input placeholder="from latitude" value={tripFrom.latitude} onChange={e => setTripFrom({...tripFrom, latitude: e.target.value})} />
        <input placeholder="from longitude" value={tripFrom.longitude} onChange={e => setTripFrom({...tripFrom, longitude: e.target.value})} />
        <div>
          <small>Click the button next to a loaded location above (or paste an id)</small>
        </div>
        <div>
          <input id="destId" placeholder="destination id" />
          <button onClick={() => calcTrip(document.getElementById("destId").value)}>Get Trip Cost</button>
        </div>
        {tripResult && (
          <div>
            <p>Total: {tripResult.total_cost}</p>
            <p>Fuel: {tripResult.fuel_cost}</p>
            <p>Toll: {tripResult.toll_cost}</p>
          </div>
        )}
      </div>
    </div>
  );
}
