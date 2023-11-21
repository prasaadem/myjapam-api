import express, { Application, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import errors from 'restify-errors';
import indexRoutes from './routes/index';
import authRoutes from './routes/auth';
import itemsRoutes from './routes/items';
import eventRoutes from './routes/event';
import subscriptionRoutes from './routes/subscription';
import logRoutes from './routes/log';
import connectDB from './db';
import dotenv from 'dotenv';

dotenv.config();

const app: Application = express();
const PORT: number = parseInt(process.env.PORT as string, 10) || 3000;

connectDB();

app.use(express.json());

const authenticateToken = (req: any, res: Response, next: NextFunction) => {
  const token = req.header('Authorization');
  if (!token) {
    return next(new errors.UnauthorizedError('Access denied'));
  }

  jwt.verify(token, process.env.SECRET_KEY as string, (err: any, user: any) => {
    if (err) {
      return next(new errors.UnauthorizedError('Invalid token'));
    }
    req.user = user;
    next();
  });
};

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/items', authenticateToken, itemsRoutes);
app.use('/events', authenticateToken, eventRoutes);
app.use('/logs', authenticateToken, logRoutes);
app.use('/subscriptions', authenticateToken, subscriptionRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
