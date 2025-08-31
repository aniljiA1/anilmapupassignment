import axios from "axios";
const API_BASE = import.meta.env.VITE_API_BASE || "https://anilmapupbackendcode.onrender.com";

export const postLocation = (body) => axios.post(`${API_BASE}/locations`, body).then(r => r.data);
export const getLocationsByCategory = (category) => axios.get(`${API_BASE}/locations/${category}`).then(r => r.data);
export const postSearch = (body) => axios.post(`${API_BASE}/search`, body).then(r => r.data);
export const postTripCost = (id, body) => axios.post(`${API_BASE}/trip-cost/${id}`, body).then(r => r.data);
