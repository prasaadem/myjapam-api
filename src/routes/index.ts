import { Router } from 'express';
import { connectToDatabase } from '../db';

const router = Router();

router.get('/', (req, res) => {
  const htmlResponse = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>My Japam</title>
    </head>
    <body>
      <h1>Welcome to My Japam App</h1>
      <p>This is a simple app that let's uses create Japams and keep track of their japams.</p>
      <p>Check the <a href="/check-db">/check-db</a> endpoint to test the database connection.</p>
    </body>
    </html>
  `;

  res.status(200).send(htmlResponse);
});

// Check database connection
router.get('/check-db', async (req, res) => {
  try {
    const connection = await connectToDatabase();

    if (connection) {
      res.send(200).json({ status: 'Connected to the database' });
    } else {
      res.status(500).json({ status: 'Database connection is closed' });
    }
  } catch (error: any) {
    res.status(500).json({
      status: 'Error connecting to the database',
      error: error.message,
    });
  }
});

export default router;
