import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import locationsRouter from "./routes/locations.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/mapup";

mongoose.connect(MONGODB_URI, { })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

app.use("/", locationsRouter);

app.get("/", (req, res) => {
  res.send({ message: "MapUp Nearby Locations API" });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
