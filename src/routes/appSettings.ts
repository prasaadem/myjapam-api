// src/routes/appSettings.ts
import express from "express";
import { getSettings, updateSettings } from "../controllers/appSettings";

const router = express.Router();

// GET  /settings  — any authenticated user
router.get("/", getSettings);

// PATCH /settings — admin only
router.patch("/", updateSettings);

export default router;
