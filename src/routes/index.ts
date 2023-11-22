import { Router } from 'express';
import { connectToDatabase } from '../db';

const router = Router();

router.get('/', (req, res) => {
  res.send('Home Page welcome');
});

// Check database connection
router.get('/check-db', async (req, res) => {
  try {
    const connection = await connectToDatabase();

    if (connection.readyState === 1) {
      res.send(200).json({ status: 'Connected to the database' });
    } else {
      res.status(500).json({ status: 'Database connection is closed' });
    }
  } catch (error: any) {
    res
      .status(500)
      .json({
        status: 'Error connecting to the database',
        error: error.message,
      });
  }
});

export default router;
