// src/db.ts
import mongoose, { Connection } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.MONGODB_URI as string;
const DATABASE_NAME = process.env.MONGODB_DB as string;

let connection: any;

export const connectToDatabase = async (): Promise<Connection> => {
  if (!connection) {
    try {
      // Connect to AWS DocumentDB using mongoose
      connection = await mongoose.connect(DATABASE_URL, {
        dbName: DATABASE_NAME,
      });

      console.log('Connected to the database');
    } catch (error: any) {
      console.error('Error connecting to the database:', error.message);
      throw error;
    }
  }

  return connection;
};

export const getDatabase = () => {
  if (!connection) {
    throw new Error(
      'Must connect to the database before accessing collections'
    );
  }
  return connection.db;
};
