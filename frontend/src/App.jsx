//import Dashboard from "./components/Dashboard"; 
//import LocationsPanel from "./components/LocationsPanel"; 
// import TripCostPanel from "./components/TripCostPanel"; 

// export default function App() { 
// return ( 
// <div className="app min-h-screen flex flex-col bg-gray-100 text-gray-900">

//    <h1 className="text-2xl font-bold text-center p-4 bg-blue-500 text-white"> MapUp — EV Analytics Dashboard </h1> 
//    <div className="flex flex-1"> 
//     <div className="w-1/4 p-4">
//      <LocationsPanel />
//       <TripCostPanel /> 
// </div> <div className="flex-1 p-4"> 
//   <Dashboard /> 
//   </div>
//    </div> 
//    </div> 
//    ); 
//   }


import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import Dashboard from "./components/Dashboard";
import LocationsPanel from "./components/LocationsPanel";

export default function App() {
  const [rows, setRows] = useState([]);
  const [aggregates, setAggregates] = useState({});

  // Function to build summary (example: EV count per state)
  const buildAggregates = (data) => {
    const byState = {};
    data.forEach((d) => {
      if (d.state) {
        byState[d.state] = (byState[d.state] || 0) + 1;
      }
    });
    setAggregates(byState);
  };

  // Auto-load CSV from /public/data on mount
  useEffect(() => {
    Papa.parse("/data/ev_population.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data.map((r) => {
          const state = r.State ?? r.state ?? r.STATE ?? "";
          const yearRaw =
            r["Model Year"] ?? r.ModelYear ?? r.year ?? r.Year;
          const year =
            yearRaw !== undefined && yearRaw !== "" ? Number(yearRaw) : null;
          const latitudeRaw = r.Latitude ?? r.latitude ?? r.lat;
          const longitudeRaw = r.Longitude ?? r.longitude ?? r.lon;
          const latitude =
            latitudeRaw !== undefined && latitudeRaw !== ""
              ? Number(latitudeRaw)
              : null;
          const longitude =
            longitudeRaw !== undefined && longitudeRaw !== ""
              ? Number(longitudeRaw)
              : null;
          const ev_type =
            r["Electric Vehicle Type"] ??
            r.EV_TYPE ??
            r.ev_type ??
            "Unknown";
          const make = r.Make ?? r.make ?? "";
          const model = r.Model ?? r.model ?? "";

          return { state, year, latitude, longitude, ev_type, make, model };
        });

        setRows(data);
        buildAggregates(data);
      },
    });
  }, []);

  return (
    <div className="app min-h-screen flex flex-col bg-gray-100 text-gray-900">
      {/* Header */}
      <header className="bg-blue-600 text-white py-4 px-6 shadow-md">
        <h1 className="text-2xl font-bold">MapUp — EV Analytics Dashboard</h1>
      </header>

      {/* Main */}
      <main className="flex flex-1 p-6 gap-6">
        <section className="flex-1 bg-white shadow-md rounded-xl p-4">
          <Dashboard rows={rows} aggregates={aggregates} />
        </section>
        <aside className="w-80 bg-white shadow-md rounded-xl p-4">
          <LocationsPanel rows={rows} />
        </aside>
      </main>

      {/* Footer */}
      <footer className="bg-gray-200 py-3 text-center text-sm text-gray-600">
        © 2025 MapUp — Demo Dashboard • Built with React + Vite
      </footer>
    </div>
  );
}
