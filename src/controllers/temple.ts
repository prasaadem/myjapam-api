// src/controllers/temple.ts
import { Response } from "express";
import axios from "axios";
import mongoose from "mongoose";
import Temple from "../models/temple";
import TempleSearchCache from "../models/templeSearchCache";
import TempleVisit from "../models/templeVisit";

// ─── Geohash encoder (precision 5 ≈ 5km × 5km, no extra packages) ────────────
const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

function encodeGeohash(lat: number, lng: number, precision = 5): string {
  let minLat = -90,
    maxLat = 90,
    minLng = -180,
    maxLng = 180;
  let hash = "";
  let bits = 0,
    bitsTotal = 0,
    hashValue = 0;
  let isEven = true;

  while (hash.length < precision) {
    if (isEven) {
      const midLng = (minLng + maxLng) / 2;
      if (lng >= midLng) {
        hashValue = (hashValue << 1) | 1;
        minLng = midLng;
      } else {
        hashValue = hashValue << 1;
        maxLng = midLng;
      }
    } else {
      const midLat = (minLat + maxLat) / 2;
      if (lat >= midLat) {
        hashValue = (hashValue << 1) | 1;
        minLat = midLat;
      } else {
        hashValue = hashValue << 1;
        maxLat = midLat;
      }
    }
    isEven = !isEven;
    bits++;
    bitsTotal++;
    if (bits === 5) {
      hash += BASE32[hashValue];
      bits = 0;
      hashValue = 0;
    }
  }
  return hash;
}

// ─── Haversine distance in km ─────────────────────────────────────────────────
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Build the Google photo URL server-side so the API key stays hidden ───────
function buildPhotoUrl(photoReference: string, maxWidth = 400): string {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key || !photoReference) return "";
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${key}`;
}

// ─── Call Google Places Nearby Search API ────────────────────────────────────
async function fetchFromGoogle(
  lat: number,
  lng: number,
  radius: number
): Promise<any[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY is not configured");

  const url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
  const params = {
    location: `${lat},${lng}`,
    radius,
    type: "hindu_temple",
    key,
  };

  const response = await axios.get(url, { params });
  if (response.data.status !== "OK" && response.data.status !== "ZERO_RESULTS") {
    throw new Error(`Google Places API error: ${response.data.status}`);
  }
  return response.data.results || [];
}

// ─── GET /temples/nearby?lat=X&lng=Y&radius=50000 ────────────────────────────
export async function getNearby(req: any, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseInt(req.query.radius as string) || 50000;

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ message: "lat and lng query params are required" });
      return;
    }

    const geohash = encodeGeohash(lat, lng, 5);
    const now = new Date();

    // ── 1. Check cache ─────────────────────────────────────────────────
    const cached = await TempleSearchCache.findOne({
      geohash,
      expiresAt: { $gt: now },
    }).populate("templeIds");

    let temples: any[];

    if (cached && cached.templeIds.length > 0) {
      // Cache HIT — no Google API call
      console.log(`Temple cache HIT for geohash ${geohash}`);
      temples = cached.templeIds as any[];
    } else {
      // Cache MISS — call Google Places API
      console.log(`Temple cache MISS for geohash ${geohash} — calling Google`);
      const googleResults = await fetchFromGoogle(lat, lng, radius);

      // Upsert each temple into the Temple collection
      const templeIds: any[] = [];
      for (const place of googleResults) {
        const photoRef =
          place.photos && place.photos.length > 0
            ? place.photos[0].photo_reference
            : undefined;

        const templeGeohash = encodeGeohash(
          place.geometry.location.lat,
          place.geometry.location.lng,
          5
        );

        const upserted = await Temple.findOneAndUpdate(
          { placeId: place.place_id },
          {
            placeId: place.place_id,
            name: place.name,
            address: place.formatted_address || "",
            vicinity: place.vicinity || "",
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            geohash5: templeGeohash,
            rating: place.rating,
            userRatingsTotal: place.user_ratings_total,
            photoReference: photoRef,
            types: place.types || [],
            cachedAt: now,
          },
          { upsert: true, new: true }
        );
        templeIds.push(upserted._id);
        temples = [];
        temples.push(upserted);
      }

      // Save/update the cache entry
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 30);

      await TempleSearchCache.findOneAndUpdate(
        { geohash },
        { geohash, templeIds, cachedAt: now, expiresAt },
        { upsert: true }
      );

      // Re-query to get full temple documents in correct order
      temples = await Temple.find({ _id: { $in: templeIds } });
    }

    // ── 2. Get this user's visit counts for each temple ───────────────
    const placeIds = temples.map((t: any) => t.placeId);
    const visitCounts = await TempleVisit.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), placeId: { $in: placeIds } } },
      { $group: { _id: "$placeId", count: { $sum: 1 }, lastVisit: { $max: "$visitedAt" } } },
    ]);

    const visitMap: Record<string, { count: number; lastVisit: Date }> = {};
    for (const v of visitCounts) {
      visitMap[v._id] = { count: v.count, lastVisit: v.lastVisit };
    }

    // ── 3. Build response with distance + visitCount ──────────────────
    const result = temples
      .map((t: any) => ({
        placeId: t.placeId,
        name: t.name,
        address: t.address,
        vicinity: t.vicinity,
        lat: t.lat,
        lng: t.lng,
        rating: t.rating || null,
        userRatingsTotal: t.userRatingsTotal || 0,
        photoUrl: t.photoReference ? buildPhotoUrl(t.photoReference) : null,
        types: t.types,
        distanceKm: parseFloat(haversineKm(lat, lng, t.lat, t.lng).toFixed(2)),
        visitCount: visitMap[t.placeId]?.count || 0,
        lastVisitedAt: visitMap[t.placeId]?.lastVisit || null,
      }))
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm);

    res.status(200).json({ temples: result, total: result.length, fromCache: !!cached });
  } catch (error: any) {
    console.error("Get nearby temples error:", error);
    res.status(500).json({ message: "Failed to retrieve nearby temples" });
  }
}

// ─── POST /temples/:placeId/visit ────────────────────────────────────────────
export async function markVisited(req: any, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const { placeId } = req.params;
    const { notes } = req.body;

    const temple = await Temple.findOne({ placeId });
    if (!temple) {
      res.status(404).json({ message: "Temple not found. Search for it first." });
      return;
    }

    const visit = new TempleVisit({
      userId,
      templeId: temple._id,
      placeId,
      notes: notes?.trim() || undefined,
    });
    await visit.save();

    // Return new total visit count for this user + this temple
    const totalVisits = await TempleVisit.countDocuments({ userId, placeId });

    res.status(201).json({
      message: "Visit recorded",
      visit: {
        _id: visit._id,
        placeId: visit.placeId,
        visitedAt: visit.visitedAt,
        notes: visit.notes,
      },
      totalVisits,
    });
  } catch (error: any) {
    console.error("Mark visited error:", error);
    res.status(500).json({ message: "Failed to record visit" });
  }
}

// ─── GET /temples/visits?page=1&limit=20 ─────────────────────────────────────
export async function getVisitHistory(req: any, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [visits, total] = await Promise.all([
      TempleVisit.find({ userId })
        .populate("templeId", "name vicinity address lat lng rating photoReference")
        .sort({ visitedAt: -1 })
        .skip(skip)
        .limit(limit),
      TempleVisit.countDocuments({ userId }),
    ]);

    // Attach photoUrl to each visit's temple
    const enriched = visits.map((v: any) => {
      const t = v.templeId;
      return {
        _id: v._id,
        visitedAt: v.visitedAt,
        notes: v.notes,
        placeId: v.placeId,
        temple: t
          ? {
              placeId: v.placeId,
              name: t.name,
              vicinity: t.vicinity,
              address: t.address,
              lat: t.lat,
              lng: t.lng,
              rating: t.rating,
              photoUrl: t.photoReference ? buildPhotoUrl(t.photoReference) : null,
            }
          : null,
      };
    });

    res.status(200).json({
      visits: enriched,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Get visit history error:", error);
    res.status(500).json({ message: "Failed to retrieve visit history" });
  }
}

// ─── GET /temples/:placeId ────────────────────────────────────────────────────
export async function getTempleDetail(req: any, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const { placeId } = req.params;
    const temple = await Temple.findOne({ placeId });
    if (!temple) {
      res.status(404).json({ message: "Temple not found" });
      return;
    }

    const [visitCount, lastVisit] = await Promise.all([
      TempleVisit.countDocuments({ userId, placeId }),
      TempleVisit.findOne({ userId, placeId }).sort({ visitedAt: -1 }).select("visitedAt"),
    ]);

    res.status(200).json({
      placeId: temple.placeId,
      name: temple.name,
      address: temple.address,
      vicinity: temple.vicinity,
      lat: temple.lat,
      lng: temple.lng,
      rating: temple.rating,
      userRatingsTotal: temple.userRatingsTotal,
      photoUrl: temple.photoReference ? buildPhotoUrl(temple.photoReference) : null,
      types: temple.types,
      visitCount,
      lastVisitedAt: lastVisit?.visitedAt || null,
    });
  } catch (error: any) {
    console.error("Get temple detail error:", error);
    res.status(500).json({ message: "Failed to retrieve temple details" });
  }
}
