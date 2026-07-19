import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import apiRoutes from './routes/index.js';
import { errorHandler, notFound } from './middlewares/errorMiddleware.js';
import authRoutes from './routes/auth.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Xây dựng và trả về Express app đã cấu hình đầy đủ middleware + routes.
 * Tách khỏi việc lắng nghe cổng / kết nối DB để phục vụ kiểm thử tích hợp
 * (Supertest import app trực tiếp, không cần mở server hay chạm DB thật).
 */
export function createApp() {
  const app = express();

  const allowedOrigin = process.env.CLIENT_URL;
  const origins = allowedOrigin ? allowedOrigin.split(',') : 'http://localhost:5173';
  app.use(cors({
    origin: origins,
    credentials: true
  }));
  app.use(express.json());

  // Mở khóa thư mục 'uploads' để Frontend lấy được ảnh
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Routes setup
  app.get('/', (req, res) => {
    res.status(200).json({ message: 'Optics Management API is running' });
  });

  app.get('/api/status', (req, res) => {
    const isConnected = mongoose.connection.readyState === 1;
    const dbStatus = isConnected ? 'Connected' : 'Disconnected';
    if (!isConnected) {
      return res.status(503).json({
        message: 'Backend is running but Database is disconnected',
        database: dbStatus
      });
    }
    res.status(200).json({
      message: 'Backend is connected to Frontend successfully!',
      database: `Database Status: ${dbStatus}`
    });
  });

  app.use('/api/auth', authRoutes);

  // Auth & feature routes
  app.use('/api', apiRoutes);

  // Rẽ nhánh các route root cho checkout
  app.use('/orders', orderRoutes);
  app.use('/payment', paymentRoutes);

  // 404 + centralized error handling
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
