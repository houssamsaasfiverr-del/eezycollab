import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import emailRoutes from '../../email server/src/routes/emailRoutes.js';

// Load environment variables (mainly for local netlify dev)
dotenv.config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Mount routes at both /api/email and / to support different serverless-http mapping behaviors
app.use('/api/email', emailRoutes);
app.use('/', emailRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', env: 'netlify-functions' });
});

export const handler = serverless(app);
