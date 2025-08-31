import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// fix default icon issues in some bundlers (not required in all setups)
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export default function MapView({ points = [] }) {
  const center = points.length ? [points[0].latitude, points[0].longitude] : [20.5937, 78.9629]; // India center fallback
  return (
    <div style={{ height: 400 }}>
      <MapContainer center={center} zoom={5} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {points.map((p, idx) => (
          <Marker key={idx} position={[p.latitude, p.longitude]}>
            <Popup>
              {p.make || p.model ? (
                <div>
                  <strong>{p.make} {p.model}</strong><br/>
                  Year: {p.year}<br/>
                  State: {p.state}
                </div>
              ) : (
                <div>{p.state}</div>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
