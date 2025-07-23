import express from "express";
import multer from "multer";
import db from "../db/conn.js";
import { ObjectId } from "mongodb";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Upload profile image
router.post("/profile-image", authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const usersCollection = db.collection("users");
    
    // Convert image to base64
    const imageBase64 = req.file.buffer.toString('base64');
    const imageUrl = `data:${req.file.mimetype};base64,${imageBase64}`;
    
    // Update user profile with new image
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(req.user.userId) },
      { $set: { profileImage: imageUrl } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ imageUrl, message: "Profile image updated successfully" });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

export default router;
