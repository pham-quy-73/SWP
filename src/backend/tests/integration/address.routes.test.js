import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import Address from '../../models/Address.js';
import { authHeader, createCustomer, createAddress } from '../helpers/factories.js';

const app = createApp();

describe('GET /api/addresses', () => {
  it('không đăng nhập -> 401', async () => {
    const res = await request(app).get('/api/addresses');
    expect(res.status).toBe(401);
  });

  it('trả về địa chỉ của chính user, mặc định lên đầu', async () => {
    const user = await createCustomer();
    await createAddress(user, { recipient_name: 'A', is_default: false });
    await createAddress(user, { recipient_name: 'B', is_default: true });
    const res = await request(app).get('/api/addresses').set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.result).toHaveLength(2);
    expect(res.body.result[0].is_default).toBe(true);
  });
});

describe('POST /api/addresses', () => {
  it('tạo địa chỉ đầu tiên tự động là mặc định', async () => {
    const user = await createCustomer();
    const res = await request(app).post('/api/addresses').set(authHeader(user)).send({
      recipientName: 'Nguyen A', phoneNumber: '0900000000', deliveryAddress: '1 Test St'
    });
    expect(res.status).toBe(201);
    expect(res.body.result.is_default).toBe(true);
  });

  it('thiếu field bắt buộc -> 400', async () => {
    const user = await createCustomer();
    const res = await request(app).post('/api/addresses').set(authHeader(user)).send({ recipientName: 'A' });
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });

  it('đặt isDefault=true gỡ cờ mặc định địa chỉ cũ', async () => {
    const user = await createCustomer();
    const old = await createAddress(user, { is_default: true });
    const res = await request(app).post('/api/addresses').set(authHeader(user)).send({
      recipientName: 'New', phoneNumber: '0911111111', deliveryAddress: '2 New St', isDefault: true
    });
    expect(res.status).toBe(201);
    const oldReloaded = await Address.findById(old._id);
    expect(oldReloaded.is_default).toBe(false);
  });
});

describe('PUT /api/addresses/:id', () => {
  it('cập nhật địa chỉ của mình', async () => {
    const user = await createCustomer();
    const addr = await createAddress(user);
    const res = await request(app).put(`/api/addresses/${addr._id}`).set(authHeader(user)).send({ recipientName: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.result.recipient_name).toBe('Updated');
  });

  it('cập nhật tất cả field + đặt làm mặc định', async () => {
    const user = await createCustomer();
    const old = await createAddress(user, { is_default: true });
    const target = await createAddress(user, { is_default: false });
    const res = await request(app).put(`/api/addresses/${target._id}`).set(authHeader(user)).send({
      label: 'Nhà', recipientName: 'Full Name', phoneNumber: '0988888888',
      deliveryAddress: '99 Updated St', isDefault: true
    });
    expect(res.status).toBe(200);
    expect(res.body.result.label).toBe('Nhà');
    expect(res.body.result.phone_number).toBe('0988888888');
    expect(res.body.result.delivery_address).toBe('99 Updated St');
    expect(res.body.result.is_default).toBe(true);
    expect((await Address.findById(old._id)).is_default).toBe(false);
  });

  it('không phải chủ sở hữu -> 403', async () => {
    const owner = await createCustomer();
    const other = await createCustomer();
    const addr = await createAddress(owner);
    const res = await request(app).put(`/api/addresses/${addr._id}`).set(authHeader(other)).send({ recipientName: 'Hack' });
    expect(res.status).toBe(403);
  });

  it('không tồn tại -> 404', async () => {
    const user = await createCustomer();
    const res = await request(app).put('/api/addresses/64b7f0000000000000000000').set(authHeader(user)).send({ recipientName: 'X' });
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/addresses/:id/default', () => {
  it('đặt mặc định thành công', async () => {
    const user = await createCustomer();
    const a1 = await createAddress(user, { is_default: true });
    const a2 = await createAddress(user, { is_default: false });
    const res = await request(app).put(`/api/addresses/${a2._id}/default`).set(authHeader(user));
    expect(res.status).toBe(200);
    expect((await Address.findById(a1._id)).is_default).toBe(false);
    expect((await Address.findById(a2._id)).is_default).toBe(true);
  });

  it('không phải chủ sở hữu -> 403', async () => {
    const owner = await createCustomer();
    const other = await createCustomer();
    const addr = await createAddress(owner);
    const res = await request(app).put(`/api/addresses/${addr._id}/default`).set(authHeader(other));
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/addresses/:id', () => {
  it('xóa và tự chọn địa chỉ mặc định mới', async () => {
    const user = await createCustomer();
    const def = await createAddress(user, { is_default: true });
    const other = await createAddress(user, { is_default: false });
    const res = await request(app).delete(`/api/addresses/${def._id}`).set(authHeader(user));
    expect(res.status).toBe(200);
    expect(await Address.findById(def._id)).toBeNull();
    expect((await Address.findById(other._id)).is_default).toBe(true);
  });

  it('không phải chủ sở hữu -> 403', async () => {
    const owner = await createCustomer();
    const other = await createCustomer();
    const addr = await createAddress(owner);
    const res = await request(app).delete(`/api/addresses/${addr._id}`).set(authHeader(other));
    expect(res.status).toBe(403);
  });

  it('không tồn tại -> 404', async () => {
    const user = await createCustomer();
    const res = await request(app).delete('/api/addresses/64b7f0000000000000000000').set(authHeader(user));
    expect(res.status).toBe(404);
  });
});
