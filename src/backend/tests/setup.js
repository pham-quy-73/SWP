import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Ghi lại danh sách file có sẵn trong uploads/ trước khi test chạy, để chỉ dọn
// đúng các file do test upload tạo ra (không xóa nhầm dữ liệu thật của dev).
const uploadsDir = path.resolve(process.cwd(), 'uploads');
const preexistingUploads = new Set(
  fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : []
);

// --- Biến môi trường test cố định (KHÔNG dùng .env thật để tránh chạm DB/khoá thật) ---
// Đặt trước khi bất kỳ module nào đọc process.env lúc import.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-vitest-only';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.API_URL = 'http://localhost:5000';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id.apps.googleusercontent.com';
process.env.VNP_TMN_CODE = 'TESTTMN';
process.env.VNP_HASH_SECRET = 'TESTHASHSECRET1234567890';
process.env.VNP_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
process.env.VNP_RETURN_URL = 'http://localhost:5000/payment/vnpay-callback';
process.env.SMTP_USER = 'test@opticstore.local';
process.env.SMTP_PASS = 'test-smtp-pass';

// ---------------------------------------------------------------------------
// Mock dịch vụ bên thứ ba (hoisted). Đặt trong setup file để áp dụng cho toàn
// bộ test — chặn mọi kết nối mạng thật tới SMTP / Google.
// ---------------------------------------------------------------------------

// Nodemailer: chặn gửi email thật. sendMail luôn resolve thành công.
vi.mock('nodemailer', () => {
  const sendMail = vi.fn().mockResolvedValue({ messageId: 'test-message-id' });
  const createTransport = vi.fn(() => ({ sendMail }));
  return { default: { createTransport }, createTransport };
});

// google-auth-library: chặn xác thực Google thật. Mọi instance chia sẻ cùng một
// hàm verifyIdToken (closure) nên test có thể điều khiển kết quả bằng cách tạo
// `new OAuth2Client().verifyIdToken` rồi set mockResolvedValue/mockRejectedValue.
vi.mock('google-auth-library', () => {
  const verifyIdToken = vi.fn();
  function OAuth2Client() {
    return { verifyIdToken };
  }
  return { OAuth2Client };
});

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 120000);

afterEach(async () => {
  // Dọn sạch mọi collection sau từng test để đảm bảo cô lập dữ liệu.
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
  vi.clearAllMocks();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();

  // Dọn các file ảnh do test upload tạo trong uploads/ (giữ lại file có sẵn từ trước).
  if (fs.existsSync(uploadsDir)) {
    for (const name of fs.readdirSync(uploadsDir)) {
      if (!preexistingUploads.has(name)) {
        try { fs.unlinkSync(path.join(uploadsDir, name)); } catch { /* ignore */ }
      }
    }
  }
});
