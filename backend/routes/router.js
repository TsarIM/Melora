import express from "express";
import db from "../db/conn.js";
import { ObjectId } from "mongodb";
import { authenticateToken } from "../middleware/auth.js";
import { cacheMiddleware, invalidateUserCache, invalidatePublicCache } from "../middleware/cache.js";

const router = express.Router();

// POST /api/recordings — save a recording (authenticated)
router.post("/", authenticateToken, async (req, res) => {
  const { title, notes, isPublic = false } = req.body;

  if (!title || !Array.isArray(notes)) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const newRecording = {
    title,
    notes,
    isPublic,
    userId: new ObjectId(req.user.userId),
    createdAt: new Date().toISOString(),
  };

  try {
    const collection = db.collection("recordings");
    const result = await collection.insertOne(newRecording);

    // Invalidate relevant caches
    await invalidateUserCache(req.user.userId);
    if (isPublic) {
      await invalidatePublicCache();
    }

    res.status(201).json({ insertedId: result.insertedId });
  } catch (error) {
    console.error("Error saving recording:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/recordings — get user's recordings (authenticated) - WITH CACHING
router.get('/', authenticateToken, cacheMiddleware(600), async (req, res) => { // 10 minutes cache
  try {
    const collection = db.collection("recordings");
    const results = await collection.find({
      userId: new ObjectId(req.user.userId)
    }).toArray();

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching recordings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/recordings/public — get public recordings for feed - WITH CACHING
router.get('/public', cacheMiddleware(300), async (req, res) => { // 5 minutes cache
  try {
    const collection = db.collection("recordings");
    const results = await collection.aggregate([
      { $match: { isPublic: true } },
      { $sort: { createdAt: -1 } },
      { $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user"
      }},
      { $unwind: "$user" },
      { $project: {
        title: 1,
        notes: 1,
        createdAt: 1,
        "user.username": 1,
        "user.name": 1,
        "user.profileImage": 1
      }}
    ]).toArray();

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching public recordings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/recordings/:id — update recording (publish/unpublish)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { isPublic } = req.body;
    const collection = db.collection("recordings");
    
    // Get the recording before update to check previous public status
    const existingRecording = await collection.findOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(req.user.userId)
    });

    if (!existingRecording) {
      return res.status(404).json({ error: "Recording not found" });
    }

    const result = await collection.updateOne(
      {
        _id: new ObjectId(req.params.id),
        userId: new ObjectId(req.user.userId)
      },
      { $set: { isPublic } }
    );

    // Invalidate caches based on visibility changes
    await invalidateUserCache(req.user.userId);
    
    // If the recording was public before OR is now public, invalidate public cache
    if (existingRecording.isPublic || isPublic) {
      await invalidatePublicCache();
    }

    res.json({ message: "Recording updated successfully" });
  } catch (error) {
    console.error("Error updating recording:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/recordings/:id — delete recording
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const collection = db.collection("recordings");
    
    // Get the recording before deletion to check if it was public
    const existingRecording = await collection.findOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(req.user.userId)
    });

    if (!existingRecording) {
      return res.status(404).json({ error: "Recording not found" });
    }

    const result = await collection.deleteOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(req.user.userId)
    });

    // Invalidate relevant caches
    await invalidateUserCache(req.user.userId);
    if (existingRecording.isPublic) {
      await invalidatePublicCache();
    }

    res.json({ message: "Recording deleted successfully" });
  } catch (error) {
    console.error("Error deleting recording:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
