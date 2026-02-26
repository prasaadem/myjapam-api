// src/routes/temple.ts
import express from "express";
import {
  getNearby,
  markVisited,
  getVisitHistory,
  getTempleDetail,
} from "../controllers/temple";

const router = express.Router();

// GET /temples/nearby?lat=X&lng=Y&radius=5000
router.get("/nearby", getNearby);

// GET /temples/visits?page=1&limit=20
router.get("/visits", getVisitHistory);

// GET /temples/:placeId
router.get("/:placeId", getTempleDetail);

// POST /temples/:placeId/visit
router.post("/:placeId/visit", markVisited);

export default router;
