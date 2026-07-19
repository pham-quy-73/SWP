import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { createApp } from './app.js';
import { startOrderStatusCleanupJob } from './jobs/orderCleanupJob.js';

dotenv.config();

// Connect to database, then khởi tạo job dọn dẹp đơn hàng quá hạn 15 phút
connectDB().then(() => {
  startOrderStatusCleanupJob();
});

const app = createApp();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
