// src/controllers/festival.ts
import { Response } from "express";
import Festival from "../models/festival";
import User from "../models/user";

// ─── Helper: ensure caller is admin ──────────────────────────────────────────
async function requireAdmin(userId: string, res: Response): Promise<boolean> {
  const user = await User.findById(userId);
  if (!user || !user.is_admin) {
    res.status(403).json({ message: "Access denied. Admin privileges required." });
    return false;
  }
  return true;
}

// ─── GET /festivals?year=2026&category=ekadashi ───────────────────────────────
export async function getFestivals(req: any, res: Response): Promise<void> {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const category = req.query.category as string | undefined;

    const query: any = { year };
    if (category) query.category = category;

    const festivals = await Festival.find(query).sort({ date: 1 });
    res.status(200).json({ festivals, total: festivals.length });
  } catch (error: any) {
    console.error("Get festivals error:", error);
    res.status(500).json({ message: "Failed to retrieve festivals" });
  }
}

// ─── GET /festivals/upcoming?days=14 ─────────────────────────────────────────
export async function getUpcomingFestivals(
  req: any,
  res: Response
): Promise<void> {
  try {
    const days = parseInt(req.query.days as string) || 14;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const future = new Date(today);
    future.setDate(future.getDate() + days);

    const festivals = await Festival.find({
      date: { $gte: today, $lte: future },
    }).sort({ date: 1 });

    res.status(200).json({ festivals, total: festivals.length });
  } catch (error: any) {
    console.error("Get upcoming festivals error:", error);
    res.status(500).json({ message: "Failed to retrieve upcoming festivals" });
  }
}

// ─── POST /festivals — add a single festival (admin) ─────────────────────────
export async function createFestival(req: any, res: Response): Promise<void> {
  try {
    if (!(await requireAdmin(req.user?.userId, res))) return;

    const { name, date, endDate, category, description, deity, isMultiDay, year } = req.body;

    if (!name || !date || !category || !year) {
      res.status(400).json({ message: "name, date, category, and year are required" });
      return;
    }

    const festival = new Festival({
      name: name.trim(),
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : undefined,
      category,
      description: description?.trim() || "",
      deity: deity?.trim() || undefined,
      isMultiDay: isMultiDay ?? false,
      year,
    });

    await festival.save();
    res.status(201).json({ message: "Festival created", festival });
  } catch (error: any) {
    console.error("Create festival error:", error);
    res.status(500).json({ message: "Failed to create festival" });
  }
}

// ─── POST /festivals/bulk — insert an array of festivals (admin) ──────────────
// Skips duplicates (same name + date) rather than erroring.
export async function bulkCreateFestivals(req: any, res: Response): Promise<void> {
  try {
    if (!(await requireAdmin(req.user?.userId, res))) return;

    const { festivals, replace } = req.body;

    if (!Array.isArray(festivals) || festivals.length === 0) {
      res.status(400).json({ message: "festivals must be a non-empty array" });
      return;
    }

    // Optional: wipe existing data for the affected years before inserting
    if (replace === true) {
      const years = [...new Set(festivals.map((f: any) => f.year).filter(Boolean))];
      if (years.length > 0) {
        await Festival.deleteMany({ year: { $in: years } });
      }
    }

    const docs = festivals.map((f: any) => ({
      name: f.name?.trim(),
      date: new Date(f.date),
      endDate: f.endDate ? new Date(f.endDate) : undefined,
      category: f.category,
      description: f.description?.trim() || "",
      deity: f.deity?.trim() || undefined,
      isMultiDay: f.isMultiDay ?? false,
      year: f.year,
    }));

    // ordered: false lets Mongo continue on duplicate-key errors
    const result = await Festival.insertMany(docs, { ordered: false });
    res.status(201).json({
      message: `Inserted ${result.length} of ${docs.length} festivals`,
      inserted: result.length,
      total: docs.length,
    });
  } catch (error: any) {
    // insertMany with ordered:false throws but still inserts the successful ones
    const inserted = error.insertedDocs?.length ?? 0;
    if (error.code === 11000 || inserted > 0) {
      res.status(207).json({
        message: `Partial insert: ${inserted} inserted, some skipped (duplicates)`,
        inserted,
      });
      return;
    }
    console.error("Bulk create festivals error:", error);
    res.status(500).json({ message: "Failed to bulk insert festivals" });
  }
}

// ─── PATCH /festivals/:id — update a festival by ID (admin) ──────────────────
export async function updateFestival(req: any, res: Response): Promise<void> {
  try {
    if (!(await requireAdmin(req.user?.userId, res))) return;

    const { id } = req.params;
    const { name, date, endDate, category, description, deity, isMultiDay, year } = req.body;

    const update: any = {};
    if (name !== undefined) update.name = name.trim();
    if (date !== undefined) update.date = new Date(date);
    if (endDate !== undefined) update.endDate = endDate ? new Date(endDate) : null;
    if (category !== undefined) update.category = category;
    if (description !== undefined) update.description = description.trim();
    if (deity !== undefined) update.deity = deity?.trim() || undefined;
    if (isMultiDay !== undefined) update.isMultiDay = isMultiDay;
    if (year !== undefined) update.year = year;

    if (Object.keys(update).length === 0) {
      res.status(400).json({ message: "No fields provided to update" });
      return;
    }

    const updated = await Festival.findByIdAndUpdate(id, update, { new: true });
    if (!updated) {
      res.status(404).json({ message: "Festival not found" });
      return;
    }

    res.status(200).json({ message: "Festival updated", festival: updated });
  } catch (error: any) {
    console.error("Update festival error:", error);
    res.status(500).json({ message: "Failed to update festival" });
  }
}

// ─── DELETE /festivals/:id — delete a festival by ID (admin) ─────────────────
export async function deleteFestival(req: any, res: Response): Promise<void> {
  try {
    if (!(await requireAdmin(req.user?.userId, res))) return;

    const { id } = req.params;
    const deleted = await Festival.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ message: "Festival not found" });
      return;
    }

    res.status(200).json({ message: "Festival deleted" });
  } catch (error: any) {
    console.error("Delete festival error:", error);
    res.status(500).json({ message: "Failed to delete festival" });
  }
}
