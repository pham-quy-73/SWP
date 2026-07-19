import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { makeToken, authHeader, createCustomer, createManager, createProduct } from '../helpers/factories.js';

const app = createApp();

describe('authenticate middleware', () => {
  it('token hợp lệ nhưng user đã bị xóa khỏi DB -> 401', async () => {
    const user = await createCustomer();
    const token = makeToken(user);
    // Xóa user để decoded.id không còn tồn tại
    const User = (await import('../../models/User.js')).default;
    await User.findByIdAndDelete(user._id);
    const res = await request(app).get('/api/users/me').set({ Authorization: `Bearer ${token}` });
    expect(res.status).toBe(401);
    expect(res.body.error_code).toBe('UNAUTHORIZED');
  });

  it('token của tài khoản bị khóa (deleted_at) -> 403', async () => {
    const user = await createCustomer();
    const token = makeToken(user);
    const User = (await import('../../models/User.js')).default;
    await User.findByIdAndUpdate(user._id, { deleted_at: new Date() });
    const res = await request(app).get('/api/users/me').set({ Authorization: `Bearer ${token}` });
    expect(res.status).toBe(403);
    expect(res.body.error_code).toBe('FORBIDDEN');
  });

  it('header không phải Bearer -> 401', async () => {
    const res = await request(app).get('/api/users/me').set({ Authorization: 'Basic abc' });
    expect(res.status).toBe(401);
  });
});

describe('optionalAuthenticate middleware', () => {
  it('token hỏng -> vẫn cho qua như khách (200)', async () => {
    const res = await request(app).get('/api/products').set({ Authorization: 'Bearer broken.token.here' });
    expect(res.status).toBe(200);
  });

  it('không có header -> qua như khách', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
  });

  it('token staff hợp lệ -> thấy được sản phẩm INACTIVE', async () => {
    const manager = await createManager();
    await createProduct({ name: 'HiddenGem', status: 'INACTIVE' });
    const res = await request(app).get('/api/products?status=ALL').set(authHeader(manager));
    expect(res.status).toBe(200);
    expect(res.body.result.items.map((p) => p.name)).toContain('HiddenGem');
  });
});

describe('errorHandler / notFound', () => {
  it('route không tồn tại -> 404 NOT_FOUND', async () => {
    const res = await request(app).get('/api/khong-ton-tai-duong-dan');
    expect(res.status).toBe(404);
    expect(res.body.error_code).toBe('NOT_FOUND');
  });

  it('CastError (id sai định dạng) -> 400 INVALID_ID', async () => {
    const res = await request(app).get('/api/products/@@@invalid@@@');
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('INVALID_ID');
  });

  it('JSON body hỏng -> 400 INVALID_JSON', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ this is not valid json ');
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('INVALID_JSON');
  });

  it('upload sai loại file -> 400 INVALID_FILE_TYPE', async () => {
    const manager = await createManager();
    const product = await createProduct();
    const res = await request(app)
      .post(`/api/products/${product._id}/variants`)
      .set(authHeader(manager))
      .attach('files', Buffer.from('not-an-image'), { filename: 'evil.exe', contentType: 'application/octet-stream' });
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('INVALID_FILE_TYPE');
  });
});
