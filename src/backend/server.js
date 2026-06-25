import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFound } from './middlewares/errorMiddleware.js';
import authRoutes from './routes/auth.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

import Order from './models/Order.js';
import OrderItem from './models/OrderItem.js';
import Product from './models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Connect to database
connectDB().then(() => {
  // Start job dọn dẹp đơn hàng quá hạn 15 phút
  startOrderStatusCleanupJob();
});

function startOrderStatusCleanupJob() {
  console.log('[Cleaner] Background job dọn dẹp đơn hàng PENDING quá hạn đã được khởi tạo.');
  // Quét định kỳ mỗi 5 phút (300000 ms)
  setInterval(async () => {
    try {
      const expirationTime = new Date(Date.now() - 15 * 60 * 1000); // 15 phút trước
      const expiredOrders = await Order.find({
        status: 'PENDING',
        created_at: { $lt: expirationTime }
      });

      if (expiredOrders.length > 0) {
        console.log(`[Cleaner] Tìm thấy ${expiredOrders.length} đơn hàng PENDING hết hạn thanh toán. Tiến hành hủy tự động...`);
        for (const order of expiredOrders) {
          // Hoàn lại số lượng tồn kho cho sản phẩm
          const items = await OrderItem.find({ order_id: order._id });
          for (const item of items) {
            if (item.product_id) {
              await Product.findByIdAndUpdate(item.product_id, {
                $inc: { stock_quantity: item.quantity }
              });
            }
          }
          order.status = 'CANCELLED';
          await order.save();
          console.log(`[Cleaner] Đã tự động hủy đơn hàng #${order._id.toString().slice(-6).toUpperCase()} và trả lại kho.`);
        }
      }
    } catch (err) {
      console.error('[Cleaner Error] Lỗi xảy ra trong quá trình dọn dẹp tự động:', err);
    }
  }, 5 * 60 * 1000);
}

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json());

// Mở khóa thư mục 'uploads' để Frontend lấy được ảnh
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes setup
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Optics Management API is running' });
});

app.get('/api/status', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

