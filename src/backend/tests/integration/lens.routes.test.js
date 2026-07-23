import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import Lens from '../../models/Lens.js';
import { authHeader, createManager, createCustomer } from '../helpers/factories.js';

const app = createApp();

describe('GET /api/lenses', () => {
  it('lấy danh sách tròng kính ACTIVE thành công', async () => {
    await Lens.create([
      { name: 'Tròng kính A', material: 'CR-39', price: 200000, status: 'ACTIVE' },
      { name: 'Tròng kính B', material: 'Polycarbonate', price: 300000, status: 'ACTIVE' },
      { name: 'Tròng kính C (Inactive)', material: 'Trivex', price: 400000, status: 'INACTIVE' }
    ]);

    const res = await request(app).get('/api/lenses');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);
    const names = res.body.data.map(l => l.name);
    expect(names).toContain('Tròng kính A');
    expect(names).toContain('Tròng kính B');
    expect(names).not.toContain('Tròng kính C (Inactive)');
  });

  it('lọc tròng kính theo từ khóa search', async () => {
    await Lens.create([
      { name: 'Tròng kính chống tia UV', material: 'Polycarbonate', price: 350000 },
      { name: 'Tròng kính đổi màu', material: 'Trivex', price: 800000 }
    ]);

    const res = await request(app).get('/api/lenses?search=UV');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Tròng kính chống tia UV');
  });
});

describe('GET /api/lenses/:id', () => {
  it('trả về chi tiết 1 tròng kính theo ID', async () => {
    const lens = await Lens.create({
      name: 'Tròng kính siêu mỏng 1.67',
      material: 'Nhựa 1.67',
      price: 900000,
      description: 'Rất mỏng, dành cho độ cận cao.'
    });

    const res = await request(app).get(`/api/lenses/${lens._id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Tròng kính siêu mỏng 1.67');
  });

  it('ID không tồn tại -> 404', async () => {
    const res = await request(app).get('/api/lenses/64b7f0000000000000000000');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/lenses', () => {
  it('MANAGER tạo mới tròng kính thành công', async () => {
    const manager = await createManager();
    const newLensData = {
      name: 'Tròng kính siêu mỏng 1.74',
      material: 'Nhựa 1.74',
      price: 1200000,
      description: 'Mỏng nhất hiện nay.'
    };

    const res = await request(app)
      .post('/api/lenses')
      .set(authHeader(manager))
      .send(newLensData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(newLensData.name);

    const inDb = await Lens.findById(res.body.data._id);
    expect(inDb).not.toBeNull();
    expect(inDb.price).toBe(1200000);
  });

  it('không token -> 401; CUSTOMER -> 403 (write bị khóa)', async () => {
    const payload = { name: 'Tròng X', material: 'CR-39', price: 100000 };

    const noToken = await request(app).post('/api/lenses').send(payload);
    expect(noToken.status).toBe(401);

    const customer = await createCustomer();
    const asCustomer = await request(app).post('/api/lenses').set(authHeader(customer)).send(payload);
    expect(asCustomer.status).toBe(403);

    expect(await Lens.countDocuments({ name: 'Tròng X' })).toBe(0);
  });

  it('giá âm / thiếu trường bắt buộc -> 400', async () => {
    const manager = await createManager();

    const negative = await request(app).post('/api/lenses').set(authHeader(manager))
      .send({ name: 'Tròng âm', material: 'CR-39', price: -5000 });
    expect(negative.status).toBe(400);

    const missing = await request(app).post('/api/lenses').set(authHeader(manager))
      .send({ name: 'Thiếu giá', material: 'CR-39' });
    expect(missing.status).toBe(400);
  });

  it('PUT cập nhật một phần không xóa trường cũ; status lạ -> 400', async () => {
    const manager = await createManager();
    const lens = await Lens.create({ name: 'Tròng gốc', material: 'CR-39', price: 500000, description: 'mô tả gốc' });

    const res = await request(app).put(`/api/lenses/${lens._id}`).set(authHeader(manager))
      .send({ price: 600000 });
    expect(res.status).toBe(200);
    expect(res.body.data.price).toBe(600000);
    expect(res.body.data.name).toBe('Tròng gốc');
    expect(res.body.data.description).toBe('mô tả gốc');

    const badStatus = await request(app).put(`/api/lenses/${lens._id}`).set(authHeader(manager))
      .send({ status: 'DELETED' });
    expect(badStatus.status).toBe(400);
  });
});
