import express from "express";
import {
  createLocation,
  getLocationsByCategory,
  searchNearby,
  tripCost
} from "../controllers/locationsController.js";

const router = express.Router();

router.post("/locations", createLocation);
router.get("/locations/:category", getLocationsByCategory);
router.post("/search", searchNearby);
router.post("/trip-cost/:location_id", tripCost);

export default router;
