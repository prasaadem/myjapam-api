import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string, {});
    console.log('Connected to the database');
  } catch (error: any) {
    console.error('Database connection failed:', error.message);
    process.exit(1); // Exit the application if database connection fails
  }
};

export default connectDB;
