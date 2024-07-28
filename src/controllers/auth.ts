// src/controllers/authController.ts
import { Request, Response } from "express";
const { User } = require("../models/user");

import Terms from "../models/terms";
import Session from "../models/session";

export async function loginUser(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;
  try {
    const user = await User.findByCredentials(username, password);
    if (user) {
      const token = user.generateAuthToken();

      // Save the session to the database
      const session = new Session({
        userId: user._id,
        username: user.username,
        token: token,
      });
      await session.save();

      res.json({
        token,
        user: user,
      });
    } else {
      res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function registerUser(req: Request, res: Response): Promise<void> {
  const { username, password, first_name, last_name, version } = req.body;

  try {
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      res.status(409).json({ message: "Username already exists" });
    } else {
      const newUser = new User({ username, password, first_name, last_name });
      await newUser.save();
      const token = newUser.generateAuthToken();

      // Save the session to the database
      const session = new Session({
        userId: newUser._id,
        username: newUser.username,
        token: token,
      });
      await session.save();

      if (version) {
        const newTerms = new Terms({
          userId: newUser._id,
          version: version,
        });
        await newTerms.save();
      }

      res.json({
        token,
        user: newUser,
      });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const userId = req.params.id;
  const { first_name, last_name } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { first_name, last_name },
      { new: true, runValidators: true }
    );

    if (updatedUser) {
      res.status(200).json(updatedUser);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function updateTerms(req: Request, res: Response): Promise<void> {
  const userId = req.params.id;
  const { version } = req.body;

  try {
    const newTerms = new Terms({
      userId: userId,
      version: version,
    });
    await newTerms.save();

    const terms = await Terms.find({ userId });

    res.status(200).json(terms);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function getTerms(req: Request, res: Response): Promise<void> {
  const userId = req.params.id;

  try {
    const terms = await Terms.find({
      userId: userId,
    });

    res.status(200).json(terms);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

// Example deleteUser handler with authentication
export const deleteUser = async (req: any, res: Response) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid or missing authentication token",
      });
    }

    const deletedUser = await User.findOneAndUpdate(
      {
        _id: userId,
      },
      {
        $set: {
          tombstonedDate: new Date().toISOString(),
        },
      },
      {
        upsert: false,
        runValidators: true,
      }
    );

    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
      user: deletedUser,
    });
  } catch (error: any) {
    console.error("Error deleting user:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
