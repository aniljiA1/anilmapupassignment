import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import MapView from "./MapView";

export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [byYear, setByYear] = useState([]);
  const [byType, setByType] = useState([]);
  const [topStates, setTopStates] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/data/ev_population.csv");
        const csv = await res.text();
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data.map(r => {
              // coerce lat/lon/year if present
              return {
                state: r.state || r.State || r.STATE || "",
                year: r.year ? Number(r.year) : (r.Year ? Number(r.Year) : null),
                latitude: r.latitude ? Number(r.latitude) : (r.lat ? Number(r.lat) : null),
                longitude: r.longitude ? Number(r.longitude) : (r.lon ? Number(r.lon) : null),
                ev_type: r.ev_type || r.EV_TYPE || r.type || "unknown",
                ...r
              };
            });
            setRows(data);
            buildAggregates(data);
          }
        });
      } catch (err) {
        console.error("Failed to load CSV", err);
      }
    }
    load();
  }, []);

  function buildAggregates(data) {
    // by year count
    const yearMap = {};
    data.forEach(d => {
      const y = d.year || "Unknown";
      yearMap[y] = (yearMap[y] || 0) + 1;
    });
    const byYearArr = Object.keys(yearMap).sort().map(y => ({ year: y, count: yearMap[y] }));
    setByYear(byYearArr);

    // by type
    const typeMap = {};
    data.forEach(d => {
      const t = d.ev_type || "unknown";
      typeMap[t] = (typeMap[t] || 0) + 1;
    });
    const byTypeArr = Object.entries(typeMap).map(([key, value]) => ({ name: key, value }));
    setByType(byTypeArr);

    // top states
    const stateMap = {};
    data.forEach(d => {
      const s = d.state || "Unknown";
      stateMap[s] = (stateMap[s] || 0) + 1;
    });
    const top = Object.entries(stateMap)
      .map(([k, v]) => ({ state: k, count: v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
    setTopStates(top);
  }

  return (
    <div className="dashboard">
      <section className="metrics">
        <div className="card">
          <h3>Total records</h3>
          <p>{rows.length}</p>
        </div>
        <div className="card">
          <h3>Distinct EV Types</h3>
          <p>{new Set(rows.map(r => r.ev_type)).size}</p>
        </div>
        <div className="card">
          <h3>Top State</h3>
          <p>{topStates[0]?.state || "N/A"} ({topStates[0]?.count || 0})</p>
        </div>
      </section>

      <section className="charts">
        <div className="chart">
          <h4>EV Records by Year</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={byYear}>
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart">
          <h4>EV Type Distribution</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={byType} dataKey="value" nameKey="name" outerRadius={90} label>
                {byType.map((entry, index) => <Cell key={`c-${index}`} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="map-section">
        <h4>Map — dataset locations</h4>
        <MapView points={rows.filter(r => r.latitude && r.longitude)} />
      </section>
    </div>
  );
}
