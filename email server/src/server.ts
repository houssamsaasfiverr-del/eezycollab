import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import emailRoutes from './routes/emailRoutes.js';

// Load local environment variables if present
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend interactions
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Serve static assets from public folder for local handshake image accessibility
app.use(express.static(path.resolve(process.cwd(), '../public')));
app.use(express.static(path.resolve(process.cwd(), './public')));

// Routes
app.use('/api/email', emailRoutes);

// Health check endpoint
app.get('/api/email/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start the server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`CollabFree Email Server running on port ${PORT}`);
  });
}

export default app;
