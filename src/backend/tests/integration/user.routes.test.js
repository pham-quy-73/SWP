import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import User from '../../models/User.js';
import { authHeader, createAdmin, createCustomer, createManager } from '../helpers/factories.js';

const app = createApp();

describe('GET /api/users/me', () => {
  it('trả về hồ sơ người dùng hiện tại', async () => {
    const user = await createCustomer();
    const res = await request(app).get('/api/users/me').set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.result._id).toBe(user._id.toString());
    expect(res.body.result.password).toBeUndefined();
  });

  it('không có token -> 401', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });

  it('token rác -> 401', async () => {
    const res = await request(app).get('/api/users/me').set({ Authorization: 'Bearer garbage' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/users (admin)', () => {
  it('customer bị chặn -> 403', async () => {
    const customer = await createCustomer();
    const res = await request(app).get('/api/users').set(authHeader(customer));
    expect(res.status).toBe(403);
  });

  it('admin lấy danh sách + phân trang', async () => {
    const admin = await createAdmin();
    await createCustomer();
    await createCustomer();
    const res = await request(app).get('/api/users?page=1&limit=2').set(authHeader(admin));
    expect(res.status).toBe(200);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.result.every((u) => u.password === undefined)).toBe(true);
  });

  it('lọc theo search', async () => {
    const admin = await createAdmin();
    await createCustomer({ username: 'findme_special', email: 'findme@test.com' });
    const res = await request(app).get('/api/users?search=findme_special').set(authHeader(admin));
    expect(res.status).toBe(200);
    expect(res.body.result.length).toBeGreaterThanOrEqual(1);
  });
});

describe('POST /api/users (admin tạo tài khoản)', () => {
  it('tạo thành công -> 201', async () => {
    const admin = await createAdmin();
    const res = await request(app).post('/api/users').set(authHeader(admin)).send({
      first_name: 'A', last_name: 'B', username: 'created1', email: 'created1@test.com', password: 'secret123', role: 'SALE'
    });
    expect(res.status).toBe(201);
    expect(res.body.result.role).toBe('SALE');
  });

  it('thiếu field -> 400', async () => {
    const admin = await createAdmin();
    const res = await request(app).post('/api/users').set(authHeader(admin)).send({ username: 'x' });
    expect(res.status).toBe(400);
  });

  it('trùng username/email -> 400 DUPLICATE_ERROR', async () => {
    const admin = await createAdmin();
    await createCustomer({ username: 'dup', email: 'dup@test.com' });
    const res = await request(app).post('/api/users').set(authHeader(admin)).send({
      first_name: 'A', last_name: 'B', username: 'dup', email: 'dup@test.com', password: 'secret123'
    });
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('DUPLICATE_ERROR');
  });
});

describe('PUT /api/users/:id/role', () => {
  it('đổi vai trò thành công', async () => {
    const admin = await createAdmin();
    const target = await createCustomer();
    const res = await request(app).put(`/api/users/${target._id}/role`).set(authHeader(admin)).send({ role: 'MANAGER' });
    expect(res.status).toBe(200);
    expect(res.body.result.role).toBe('MANAGER');
  });

  it('thiếu role -> 400', async () => {
    const admin = await createAdmin();
    const target = await createCustomer();
    const res = await request(app).put(`/api/users/${target._id}/role`).set(authHeader(admin)).send({});
    expect(res.status).toBe(400);
  });

  it('role không hợp lệ -> 400', async () => {
    const admin = await createAdmin();
    const target = await createCustomer();
    const res = await request(app).put(`/api/users/${target._id}/role`).set(authHeader(admin)).send({ role: 'KING' });
    expect(res.status).toBe(400);
  });

  it('admin tự đổi vai trò mình -> 403 SELF_ACTION_FORBIDDEN', async () => {
    const admin = await createAdmin();
    const res = await request(app).put(`/api/users/${admin._id}/role`).set(authHeader(admin)).send({ role: 'MANAGER' });
    expect(res.status).toBe(403);
    expect(res.body.error_code).toBe('SELF_ACTION_FORBIDDEN');
  });

  it('user không tồn tại -> 404', async () => {
    const admin = await createAdmin();
    const res = await request(app).put('/api/users/64b7f0000000000000000000/role').set(authHeader(admin)).send({ role: 'SALE' });
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/users/:id/status', () => {
  it('khóa user -> deleted_at set', async () => {
    const admin = await createAdmin();
    const target = await createCustomer();
    const res = await request(app).put(`/api/users/${target._id}/status`).set(authHeader(admin)).send({ status: 'INACTIVE' });
    expect(res.status).toBe(200);
    const inDb = await User.findById(target._id);
    expect(inDb.deleted_at).not.toBeNull();
  });

  it('mở khóa user -> deleted_at null', async () => {
    const admin = await createAdmin();
    const target = await createCustomer({ deleted_at: new Date() });
    const res = await request(app).put(`/api/users/${target._id}/status`).set(authHeader(admin)).send({ status: 'ACTIVE' });
    expect(res.status).toBe(200);
    const inDb = await User.findById(target._id);
    expect(inDb.deleted_at).toBeNull();
  });

  it('status không hợp lệ -> 400', async () => {
    const admin = await createAdmin();
    const target = await createCustomer();
    const res = await request(app).put(`/api/users/${target._id}/status`).set(authHeader(admin)).send({ status: 'FOO' });
    expect(res.status).toBe(400);
  });

  it('không được khóa admin khác -> 403', async () => {
    const admin = await createAdmin();
    const other = await createAdmin();
    const res = await request(app).put(`/api/users/${other._id}/status`).set(authHeader(admin)).send({ status: 'INACTIVE' });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/users/:id', () => {
  it('xóa customer thành công', async () => {
    const admin = await createAdmin();
    const target = await createCustomer();
    const res = await request(app).delete(`/api/users/${target._id}`).set(authHeader(admin));
    expect(res.status).toBe(200);
    expect(await User.findById(target._id)).toBeNull();
  });

  it('không được xóa admin -> 403', async () => {
    const admin = await createAdmin();
    const other = await createAdmin();
    const res = await request(app).delete(`/api/users/${other._id}`).set(authHeader(admin));
    expect(res.status).toBe(403);
  });

  it('user không tồn tại -> 404', async () => {
    const admin = await createAdmin();
    const res = await request(app).delete('/api/users/64b7f0000000000000000000').set(authHeader(admin));
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/users/:id/reset-password', () => {
  it('reset thành công', async () => {
    const admin = await createAdmin();
    const target = await createCustomer();
    const res = await request(app).put(`/api/users/${target._id}/reset-password`).set(authHeader(admin)).send({ newPassword: 'newsecret1' });
    expect(res.status).toBe(200);
    const inDb = await User.findById(target._id);
    expect(await inDb.comparePassword('newsecret1')).toBe(true);
  });

  it('mật khẩu quá ngắn -> 400', async () => {
    const admin = await createAdmin();
    const target = await createCustomer();
    const res = await request(app).put(`/api/users/${target._id}/reset-password`).set(authHeader(admin)).send({ newPassword: '123' });
    expect(res.status).toBe(400);
  });

  it('không được reset mật khẩu admin -> 403', async () => {
    const admin = await createAdmin();
    const other = await createAdmin();
    const res = await request(app).put(`/api/users/${other._id}/reset-password`).set(authHeader(admin)).send({ newPassword: 'newsecret1' });
    expect(res.status).toBe(403);
  });
});
