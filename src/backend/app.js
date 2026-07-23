import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import apiRoutes from './routes/index.js';
import { errorHandler, notFound } from './middlewares/errorMiddleware.js';
import authRoutes from './routes/auth.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';
import userRoutes from './routes/user.routes.js';
import productRoutes from './routes/product.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCorsOrigins } from './utils/clientUrl.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Xây dựng và trả về Express app đã cấu hình đầy đủ middleware + routes.
 * Tách khỏi việc lắng nghe cổng / kết nối DB để phục vụ kiểm thử tích hợp
 * (Supertest import app trực tiếp, không cần mở server hay chạm DB thật).
 */
export function createApp() {
  const app = express();

  app.use(cors({
    origin: getCorsOrigins(),
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

  // Auth & feature routes (all API routes unified under /api)
  app.use('/api', apiRoutes);

  // Legacy route aliases for backward compatibility and test coverage
  app.use('/orders', orderRoutes);
  app.use('/products', productRoutes);
  app.use('/users', userRoutes);
  app.use('/payment', paymentRoutes);
  app.use('/feedback', feedbackRoutes);

  // 404 + centralized error handling
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
