import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../../app.js';
import { errorHandler } from '../../middlewares/errorMiddleware.js';
import { authHeader, createCustomer, createProduct, createOrder } from '../helpers/factories.js';

const app = createApp();

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Health & status endpoints', () => {
  it('GET / -> thông điệp API đang chạy', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('running');
  });

  it('GET /api/health -> healthy', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toContain('healthy');
  });

  it('GET /api/status khi DB connected -> 200', async () => {
    const res = await request(app).get('/api/status');
    expect(res.status).toBe(200);
    expect(res.body.database).toContain('Connected');
  });

  it('GET /api/status khi DB disconnected -> 503', async () => {
    // Giả lập mất kết nối DB qua getter readyState (không disconnect thật
    // để không phá các test sau trong cùng file).
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(0);
    const res = await request(app).get('/api/status');
    expect(res.status).toBe(503);
    expect(res.body.database).toBe('Disconnected');
  });

  it('route không tồn tại -> 404 NOT_FOUND chuẩn { error_code, message }', async () => {
    const res = await request(app).get('/api/khong-ton-tai');
    expect(res.status).toBe(404);
    expect(res.body.error_code).toBe('NOT_FOUND');
    expect(res.body.message).toContain('/api/khong-ton-tai');
  });

  it('body JSON hỏng -> 400 INVALID_JSON', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{json hỏng');
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('INVALID_JSON');
  });

  it('ObjectId sai định dạng trên route dùng CastError -> 400 INVALID_ID', async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .get('/orders/not-an-object-id')
      .set(authHeader(customer));
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('INVALID_ID');
  });
});

describe('errorHandler — các nhánh phân loại lỗi (unit)', () => {
  // Gọi trực tiếp errorHandler với req/res giả để phủ các nhánh khó dựng
  // qua HTTP thật (MulterError, statusCode từ res).
  const mockRes = () => {
    const res = { statusCode: 200 };
    res.status = vi.fn((code) => { res.statusCode = code; return res; });
    res.json = vi.fn(() => res);
    return res;
  };

  it('MulterError LIMIT_FILE_SIZE -> 400 FILE_TOO_LARGE', () => {
    const err = new Error('File too large');
    err.name = 'MulterError';
    err.code = 'LIMIT_FILE_SIZE';
    const res = mockRes();
    errorHandler(err, {}, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error_code).toBe('FILE_TOO_LARGE');
  });

  it('MulterError khác (LIMIT_UNEXPECTED_FILE) -> 400 UPLOAD_ERROR', () => {
    const err = new Error('Unexpected field');
    err.name = 'MulterError';
    err.code = 'LIMIT_UNEXPECTED_FILE';
    const res = mockRes();
    errorHandler(err, {}, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error_code).toBe('UPLOAD_ERROR');
  });

  it('lỗi không statusCode + res.statusCode 200 -> 500 INTERNAL_ERROR', () => {
    const err = new Error('Boom');
    const res = mockRes();
    errorHandler(err, {}, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].error_code).toBe('INTERNAL_ERROR');
  });

  it('production -> ẩn stack trace', () => {
    const saved = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const err = new Error('Boom');
    const res = mockRes();
    errorHandler(err, {}, res, vi.fn());
    process.env.NODE_ENV = saved;
    expect(res.json.mock.calls[0][0].stack).toBeUndefined();
  });
});

describe('Legacy route aliases (tương thích ngược)', () => {
  it('/feedback (alias của /api/feedbacks) hoạt động', async () => {
    const product = await createProduct();
    const res = await request(app).get(`/feedback/product/${product._id}`);
    expect(res.status).toBe(200);
  });

  it('/users/me alias hoạt động', async () => {
    const customer = await createCustomer();
    const res = await request(app).get('/users/me').set(authHeader(customer));
    expect(res.status).toBe(200);
    expect(res.body.result._id).toBe(customer._id.toString());
  });

  it('/products alias hoạt động', async () => {
    await createProduct();
    const res = await request(app).get('/products');
    expect(res.status).toBe(200);
  });

  it('/api/management/orders alias yêu cầu quyền manager', async () => {
    const customer = await createCustomer();
    await createOrder(customer);
    const res = await request(app).get('/api/management/orders').set(authHeader(customer));
    expect(res.status).toBe(403);
  });
});
