// src/controllers/appSettings.ts
import { Response } from "express";
import AppSettings from "../models/appSettings";
import User from "../models/user";

async function requireAdmin(userId: string, res: Response): Promise<boolean> {
  const user = await User.findById(userId);
  if (!user || !user.is_admin) {
    res.status(403).json({ message: "Access denied. Admin privileges required." });
    return false;
  }
  return true;
}

// GET /settings — returns the singleton settings document (creates defaults if missing)
export async function getSettings(req: any, res: Response): Promise<void> {
  try {
    const settings = await AppSettings.findOneAndUpdate(
      { key: "singleton" },
      { $setOnInsert: { key: "singleton" } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({
      sacredTabEnabled: settings.sacredTabEnabled,
      templesEnabled: settings.templesEnabled,
      festivalsEnabled: settings.festivalsEnabled,
    });
  } catch (error: any) {
    console.error("Get settings error:", error);
    res.status(500).json({ message: "Failed to retrieve settings" });
  }
}

// PATCH /settings — admin only, update one or more flags
export async function updateSettings(req: any, res: Response): Promise<void> {
  try {
    if (!(await requireAdmin(req.user?.userId, res))) return;

    const { sacredTabEnabled, templesEnabled, festivalsEnabled } = req.body;

    const update: any = { updatedBy: req.user.userId };
    if (sacredTabEnabled !== undefined) update.sacredTabEnabled = sacredTabEnabled;
    if (templesEnabled !== undefined) update.templesEnabled = templesEnabled;
    if (festivalsEnabled !== undefined) update.festivalsEnabled = festivalsEnabled;

    if (Object.keys(update).length === 1) {
      res.status(400).json({ message: "No flags provided to update" });
      return;
    }

    const settings = await AppSettings.findOneAndUpdate(
      { key: "singleton" },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      message: "Settings updated",
      sacredTabEnabled: settings.sacredTabEnabled,
      templesEnabled: settings.templesEnabled,
      festivalsEnabled: settings.festivalsEnabled,
    });
  } catch (error: any) {
    console.error("Update settings error:", error);
    res.status(500).json({ message: "Failed to update settings" });
  }
}
