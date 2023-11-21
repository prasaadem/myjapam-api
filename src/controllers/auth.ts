// src/controllers/authController.ts
import { Request, Response } from 'express';
const { User } = require('../models/user');

export async function loginUser(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;

  try {
    const user = await User.findByCredentials(username, password);

    if (user) {
      const token = user.generateAuthToken();
      res.json({
        token,
        message: `Welcome, ${user.first_name} ${user.last_name}!`,
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function registerUser(req: Request, res: Response): Promise<void> {
  const { username, password, first_name, last_name } = req.body;

  try {
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      res.status(409).json({ message: 'Username already exists' });
    } else {
      const newUser = new User({ username, password, first_name, last_name });
      await newUser.save();
      const token = newUser.generateAuthToken();
      res.json({
        token,
        message: `Welcome, ${newUser.first_name} ${newUser.last_name}!`,
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
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}
