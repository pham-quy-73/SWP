import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { OAuth2Client } from 'google-auth-library';
import { createApp } from '../../app.js';
import User from '../../models/User.js';
import { createUser } from '../helpers/factories.js';

const app = createApp();

// Lấy instance verifyIdToken dùng chung từ mock google-auth-library (tests/setup.js)
const getVerifyIdToken = () => new OAuth2Client().verifyIdToken;

describe('POST /api/auth/register', () => {
  const valid = {
    username: 'newuser',
    email: 'newuser@test.com',
    password: 'secret123',
    first_name: 'New',
    last_name: 'User'
  };

  it('đăng ký thành công, trả 201 và ẩn dữ liệu nhạy cảm', async () => {
    const res = await request(app).post('/api/auth/register').send(valid);
    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.verify_token).toBeUndefined();
    const inDb = await User.findOne({ email: valid.email });
    expect(inDb).not.toBeNull();
    expect(inDb.is_email_verified).toBe(false);
  });

  it('thiếu trường bắt buộc -> 400 VALIDATION_ERROR', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });

  it('username < 3 ký tự -> 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...valid, username: 'ab' });
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });

  it('email sai định dạng -> 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...valid, email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  it('password < 6 ký tự -> 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...valid, password: '123' });
    expect(res.status).toBe(400);
  });

  it('trùng email -> 409', async () => {
    await createUser({ email: valid.email, username: 'other' });
    const res = await request(app).post('/api/auth/register').send(valid);
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await createUser({ username: 'loginuser', password: 'secret123', is_email_verified: true });
  });

  it('đăng nhập thành công -> 200 kèm token', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'loginuser', password: 'secret123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.password).toBeUndefined();
  });

  it('sai mật khẩu -> 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'loginuser', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('user không tồn tại -> 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'ghost', password: 'secret123' });
    expect(res.status).toBe(401);
  });

  it('thiếu field -> 400 VALIDATION_ERROR', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'loginuser' });
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });

  it('tài khoản chưa kích hoạt -> 403', async () => {
    await createUser({ username: 'unverified', password: 'secret123', is_email_verified: false });
    const res = await request(app).post('/api/auth/login').send({ username: 'unverified', password: 'secret123' });
    expect(res.status).toBe(403);
  });

  it('tài khoản bị khóa -> 403', async () => {
    await createUser({ username: 'locked', password: 'secret123', is_email_verified: true, deleted_at: new Date() });
    const res = await request(app).post('/api/auth/login').send({ username: 'locked', password: 'secret123' });
    expect(res.status).toBe(403);
  });
});

describe('POST /api/auth/google', () => {
  it('thiếu idToken -> 400', async () => {
    const res = await request(app).post('/api/auth/google').send({});
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });

  it('token hợp lệ, user mới -> tạo tài khoản và trả token', async () => {
    getVerifyIdToken().mockResolvedValueOnce({
      getPayload: () => ({
        sub: 'google-sub-123',
        email: 'guser@gmail.com',
        given_name: 'Google',
        family_name: 'User',
        picture: 'http://pic'
      })
    });
    const res = await request(app).post('/api/auth/google').send({ idToken: 'valid-token' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    const inDb = await User.findOne({ email: 'guser@gmail.com' });
    expect(inDb.google_id).toBe('google-sub-123');
  });

  it('token không hợp lệ -> 401', async () => {
    getVerifyIdToken().mockRejectedValueOnce(new Error('invalid token'));
    const res = await request(app).post('/api/auth/google').send({ idToken: 'bad-token' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/resend-verify-email', () => {
  it('email chưa kích hoạt -> 200', async () => {
    await createUser({ email: 'resend@test.com', is_email_verified: false });
    const res = await request(app).post('/api/auth/resend-verify-email').send({ email: 'resend@test.com' });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
  });

  it('email không tồn tại -> 404', async () => {
    const res = await request(app).post('/api/auth/resend-verify-email').send({ email: 'ghost@test.com' });
    expect(res.status).toBe(404);
  });

  it('đã kích hoạt -> 400', async () => {
    await createUser({ email: 'already@test.com', is_email_verified: true });
    const res = await request(app).post('/api/auth/resend-verify-email').send({ email: 'already@test.com' });
    expect(res.status).toBe(400);
  });

  it('thiếu email -> 400 VALIDATION_ERROR', async () => {
    const res = await request(app).post('/api/auth/resend-verify-email').send({});
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/auth/verify-email', () => {
  it('thiếu token -> 400', async () => {
    const res = await request(app).get('/api/auth/verify-email');
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });

  it('token hợp lệ -> redirect verified=true', async () => {
    const user = await createUser({ is_email_verified: false, verify_token: 'tok123', verify_token_expires: new Date(Date.now() + 60000) });
    const res = await request(app).get('/api/auth/verify-email').query({ token: 'tok123' });
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('verified=true');
    const updated = await User.findById(user._id);
    expect(updated.is_email_verified).toBe(true);
  });

  it('token sai -> redirect error=verify_failed', async () => {
    const res = await request(app).get('/api/auth/verify-email').query({ token: 'wrong' });
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('error=verify_failed');
  });
});
