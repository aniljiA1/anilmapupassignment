import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  category: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("Location", LocationSchema);

