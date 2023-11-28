import express, { Application, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import errors from 'restify-errors';
import indexRoutes from './routes/index';
import authRoutes from './routes/auth';
import itemsRoutes from './routes/items';
import eventRoutes from './routes/event';
import subscriptionRoutes from './routes/subscription';
import logRoutes from './routes/log';
import dotenv from 'dotenv';
import { connectToDatabase } from './db';
import cors from 'cors';
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

dotenv.config();

// Define a whitelist of allowed origins
const whitelist = [
  'http://localhost:3000',
  'http://localhost:19006',
  'https://myjapam.com',
  'https://www.myjapam.com',
];

const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Allow requests from the whitelist, and allow requests with no origin (e.g., same-origin requests)
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      // Disallow requests from other origins
      callback(new Error('Not allowed by CORS'));
    }
  },
};

async function startServer() {
  try {
    await connectToDatabase();

    const app: Application = express();
    const PORT: number = parseInt(process.env.PORT as string, 10) || 3000;

    app.use(cors(corsOptions));
    app.use(express.json());

    const authenticateToken = (req: any, res: Response, next: NextFunction) => {
      const token = req.header('Authorization');
      if (!token) {
        return next(new errors.UnauthorizedError('Access denied'));
      }

      jwt.verify(
        token,
        process.env.SECRET_KEY as string,
        (err: any, user: any) => {
          if (err) {
            return next(new errors.UnauthorizedError('Invalid token'));
          }
          req.user = user;
          next();
        }
      );
    };

    app.use('/', indexRoutes);
    app.use('/auth', authRoutes);
    app.use('/items', authenticateToken, itemsRoutes);
    app.use('/events', authenticateToken, upload.single('file'), eventRoutes);
    app.use('/logs', authenticateToken, logRoutes);
    app.use('/subscriptions', authenticateToken, subscriptionRoutes);

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error: any) {
    console.error('Failed to start the server:', error.message);
  }
}

startServer();
