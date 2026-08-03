import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import User from '../../models/User.js';
import { authHeader, createCustomer } from '../helpers/factories.js';

const app = createApp();

describe('PUT /api/users/me (cập nhật hồ sơ cá nhân)', () => {
  it('không đăng nhập -> 401', async () => {
    const res = await request(app).put('/api/users/me').send({ first_name: 'X' });
    expect(res.status).toBe(401);
  });

  it('cập nhật đầy đủ first_name/last_name/phone/dob -> 200', async () => {
    const user = await createCustomer();
    const res = await request(app)
      .put('/api/users/me')
      .set(authHeader(user))
      .send({ first_name: 'Minh', last_name: 'Trần', phone: '0912345678', dob: '1999-01-15' });
    expect(res.status).toBe(200);
    expect(res.body.result.first_name).toBe('Minh');
    expect(res.body.result.last_name).toBe('Trần');
    expect(res.body.result.phone).toBe('0912345678');
    expect(new Date(res.body.result.dob).getUTCFullYear()).toBe(1999);
    expect(res.body.result.password).toBeUndefined();
  });

  it('chỉ gửi một phần field -> field khác giữ nguyên', async () => {
    const user = await createCustomer({ first_name: 'Giữ', last_name: 'Nguyên' });
    const res = await request(app)
      .put('/api/users/me')
      .set(authHeader(user))
      .send({ phone: '0900111222' });
    expect(res.status).toBe(200);
    expect(res.body.result.first_name).toBe('Giữ');
    expect(res.body.result.last_name).toBe('Nguyên');
    expect(res.body.result.phone).toBe('0900111222');
  });

  it('dob rỗng -> set null (nhánh dob falsy)', async () => {
    const user = await createCustomer({ dob: new Date('1990-01-01') });
    const res = await request(app)
      .put('/api/users/me')
      .set(authHeader(user))
      .send({ dob: '' });
    expect(res.status).toBe(200);
    expect(res.body.result.dob).toBeNull();
  });
});

describe('PUT /api/users/me/change-password', () => {
  it('thiếu mật khẩu cũ hoặc mới -> 400', async () => {
    const user = await createCustomer();
    const res1 = await request(app)
      .put('/api/users/me/change-password')
      .set(authHeader(user))
      .send({ newPassword: 'newpass123' });
    expect(res1.status).toBe(400);
    expect(res1.body.error_code).toBe('VALIDATION_ERROR');

    const res2 = await request(app)
      .put('/api/users/me/change-password')
      .set(authHeader(user))
      .send({ oldPassword: 'password123' });
    expect(res2.status).toBe(400);
  });

  it('mật khẩu mới < 6 ký tự -> 400 (biên: 5 ký tự)', async () => {
    const user = await createCustomer();
    const res = await request(app)
      .put('/api/users/me/change-password')
      .set(authHeader(user))
      .send({ oldPassword: 'password123', newPassword: '12345' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('6 ký tự');
  });

  it('mật khẩu mới đúng 6 ký tự (biên) -> 200', async () => {
    const user = await createCustomer();
    const res = await request(app)
      .put('/api/users/me/change-password')
      .set(authHeader(user))
      .send({ oldPassword: 'password123', newPassword: '123456' });
    expect(res.status).toBe(200);
  });

  it('mật khẩu cũ sai -> 400 INVALID_PASSWORD', async () => {
    const user = await createCustomer();
    const res = await request(app)
      .put('/api/users/me/change-password')
      .set(authHeader(user))
      .send({ oldPassword: 'saibet', newPassword: 'newpass123' });
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('INVALID_PASSWORD');
  });

  it('đổi mật khẩu thành công -> đăng nhập được bằng mật khẩu mới', async () => {
    const user = await createCustomer();
    const res = await request(app)
      .put('/api/users/me/change-password')
      .set(authHeader(user))
      .send({ oldPassword: 'password123', newPassword: 'brandnew99' });
    expect(res.status).toBe(200);
    const inDb = await User.findById(user._id);
    expect(await inDb.comparePassword('brandnew99')).toBe(true);
    expect(await inDb.comparePassword('password123')).toBe(false);
  });

  it('tài khoản Google (không có password) -> bỏ qua check mật khẩu cũ', async () => {
    // User đăng ký qua Google OAuth không có trường password
    const user = await createCustomer({ password: undefined, google_id: 'g-123' });
    const res = await request(app)
      .put('/api/users/me/change-password')
      .set(authHeader(user))
      .send({ oldPassword: 'anything', newPassword: 'firstpass1' });
    expect(res.status).toBe(200);
    const inDb = await User.findById(user._id);
    expect(await inDb.comparePassword('firstpass1')).toBe(true);
  });
});
