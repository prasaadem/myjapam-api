// src/models/user.ts
import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

interface IUser extends Document {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  generateAuthToken: () => string;
  tombstonedDate?: Date;
  createdDate?: Date;
}

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  is_admin: {
    type: Boolean,
    default: false,
  },
  tombstonedDate: {
    type: Date,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre<IUser>("save", async function (next) {
  const user = this;

  // Hash the password only if it's modified or new
  if (!user.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);
    user.password = hashedPassword;
    next();
  } catch (error: any) {
    next(error);
  }
});

userSchema.methods.generateAuthToken = function (): string {
  const user = this;
  const token = jwt.sign(
    { userId: user._id, is_admin: user.is_admin },
    process.env.SECRET_KEY as string,
    {}
  );
  return token;
};

userSchema.statics.findByCredentials = async function (
  username: string,
  password: string
): Promise<IUser | null> {
  const user = await User.findOne({
    username,
    tombstonedDate: {
      $exists: false,
    },
  });

  if (!user) {
    return null;
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return null;
  }

  return user;
};

const User = mongoose.model<IUser>("User", userSchema);

module.exports = { User };
