// src/routes/festival.ts
import express from "express";
import {
  getFestivals,
  getUpcomingFestivals,
  createFestival,
  bulkCreateFestivals,
  updateFestival,
  deleteFestival,
} from "../controllers/festival";

const router = express.Router();

// ── Public (authenticated) reads ─────────────────────────────────────────────

// GET /festivals?year=2026&category=ekadashi
router.get("/", getFestivals);

// GET /festivals/upcoming?days=14
router.get("/upcoming", getUpcomingFestivals);

// ── Admin writes ─────────────────────────────────────────────────────────────

// POST /festivals/bulk   { festivals: [...], replace?: true }
// replace:true wipes the year(s) first, useful for a full re-import
router.post("/bulk", bulkCreateFestivals);

// POST /festivals        { name, date, category, year, ... }
router.post("/", createFestival);

// PATCH /festivals/:id   { any updatable fields }
router.patch("/:id", updateFestival);

// DELETE /festivals/:id
router.delete("/:id", deleteFestival);

export default router;
