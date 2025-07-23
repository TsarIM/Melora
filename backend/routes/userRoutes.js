import express from "express";
import db from "../db/conn.js";
import { ObjectId } from "mongodb";
import jwt from 'jsonwebtoken';
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Google OAuth callback
router.post("/google-auth", async (req, res) => {
  try {
    const { credential } = req.body;
    
    // Decode the JWT token from Google
    const decoded = jwt.decode(credential);
    
    if (!decoded) {
      return res.status(400).json({ error: "Invalid credential" });
    }

    const { sub: googleId, email, name, picture } = decoded;
    
    const usersCollection = db.collection("users");
    
    // Check if user exists
    let user = await usersCollection.findOne({ googleId });
    
    if (!user) {
      // Create new user
      const username = `user_${Date.now()}`;
      user = {
        googleId,
        email,
        name,
        picture,
        username,
        createdAt: new Date().toISOString()
      };
      
      const result = await usersCollection.insertOne(user);
      user._id = result.insertedId;
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token, user });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

// Get user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne(
      { _id: new ObjectId(req.user.userId) },
      { projection: { googleId: 0 } }
    );
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get profile" });
  }
});

// Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { username, name } = req.body;
    const usersCollection = db.collection("users");
    
    // Check if username is already taken
    if (username) {
      const existingUser = await usersCollection.findOne({ 
        username, 
        _id: { $ne: new ObjectId(req.user.userId) } 
      });
      
      if (existingUser) {
        return res.status(400).json({ error: "Username already taken" });
      }
    }
    
    const updateData = {};
    if (username) updateData.username = username;
    if (name) updateData.name = name;
    
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(req.user.userId) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
