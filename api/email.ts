import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import emailRoutes from '../email server/src/routes/emailRoutes.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Mount the email routes
app.use('/api/email', emailRoutes);

// Health check
app.get('/api/email/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), env: 'vercel-serverless' });
});

export default app;
