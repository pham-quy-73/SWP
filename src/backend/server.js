import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFound } from './middlewares/errorMiddleware.js';

dotenv.config();

// Connect to database
connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json());

// Routes setup
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Dormitory Management API is running' });
});

app.get('/api/status', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.status(200).json({ 
    message: 'Backend is connected to Frontend successfully!',
    database: `Database Status: ${dbStatus}`
  });
});

// Auth & feature routes
app.use('/api', apiRoutes);

// 404 + centralized error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
