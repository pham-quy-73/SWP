import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import Lens from '../../models/Lens.js';
import { authHeader, createManager, createLens } from '../helpers/factories.js';

const app = createApp();

describe('GET /api/lenses — lọc status', () => {
  it('status=ALL trả cả ACTIVE lẫn INACTIVE', async () => {
    await createLens({ status: 'ACTIVE' });
    await createLens({ status: 'INACTIVE' });
    const res = await request(app).get('/api/lenses?status=ALL');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
  });

  it('status=INACTIVE chỉ trả tròng ngưng bán', async () => {
    await createLens({ status: 'ACTIVE' });
    const inactive = await createLens({ status: 'INACTIVE' });
    const res = await request(app).get('/api/lenses?status=INACTIVE');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0]._id).toBe(inactive._id.toString());
  });

  it('search khớp material và description', async () => {
    await createLens({ name: 'A', material: 'Polycarbonate siêu nhẹ' });
    await createLens({ name: 'B', material: 'Thủy tinh', description: 'chống ánh sáng xanh' });
    await createLens({ name: 'C', material: 'Thủy tinh' });

    const byMaterial = await request(app).get('/api/lenses?search=siêu nhẹ');
    expect(byMaterial.body.count).toBe(1);

    const byDesc = await request(app).get('/api/lenses?search=ánh sáng xanh');
    expect(byDesc.body.count).toBe(1);
    expect(byDesc.body.data[0].name).toBe('B');
  });
});

describe('POST /api/lenses — validate từng trường', () => {
  // Tạo manager mới mỗi lần gọi: afterEach của setup xóa sạch DB nên không được cache user
  const create = async (body) => {
    const manager = await createManager();
    return request(app).post('/api/lenses').set(authHeader(manager)).send(body);
  };

  it('tên quá 200 ký tự -> 400', async () => {
    const res = await create({ name: 'X'.repeat(201), material: 'Nhựa', price: 100 });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('1-200');
  });

  it('tên toàn khoảng trắng -> 400', async () => {
    const res = await create({ name: '   ', material: 'Nhựa', price: 100 });
    expect(res.status).toBe(400);
  });

  it('material quá 200 ký tự -> 400', async () => {
    const res = await create({ name: 'OK', material: 'M'.repeat(201), price: 100 });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Chất liệu');
  });

  it('price = 0 (biên) hợp lệ -> 201', async () => {
    const res = await create({ name: 'Miễn phí', material: 'Nhựa', price: 0 });
    expect(res.status).toBe(201);
    expect(res.body.data.price).toBe(0);
  });

  it('price không phải số -> 400', async () => {
    const res = await create({ name: 'OK', material: 'Nhựa', price: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('không âm');
  });

  it('discountPrice âm -> 400; discountPrice rỗng -> bỏ qua', async () => {
    const bad = await create({ name: 'OK', material: 'Nhựa', price: 100, discountPrice: -5 });
    expect(bad.status).toBe(400);
    expect(bad.body.message).toContain('khuyến mãi');

    const empty = await create({ name: 'OK2', material: 'Nhựa', price: 100, discountPrice: '' });
    expect(empty.status).toBe(201);
    expect(empty.body.data.discountPrice).toBeUndefined();
  });

  it('description quá 2000 ký tự -> 400; đúng 2000 (biên) -> 201', async () => {
    const bad = await create({ name: 'OK', material: 'Nhựa', price: 100, description: 'D'.repeat(2001) });
    expect(bad.status).toBe(400);
    expect(bad.body.message).toContain('2000');

    const ok = await create({ name: 'OK3', material: 'Nhựa', price: 100, description: 'D'.repeat(2000) });
    expect(ok.status).toBe(201);
  });

  it('tên có khoảng trắng thừa -> được trim', async () => {
    const res = await create({ name: '  Tròng ABC  ', material: '  Nhựa  ', price: 100 });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Tròng ABC');
    expect(res.body.data.material).toBe('Nhựa');
  });
});

describe('PUT /api/lenses/:id — nhánh phụ', () => {
  it('body rỗng (không field hợp lệ) -> 400', async () => {
    const manager = await createManager();
    const lens = await createLens();
    const res = await request(app)
      .put(`/api/lenses/${lens._id}`)
      .set(authHeader(manager))
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Không có trường');
  });

  it('lens không tồn tại -> 404', async () => {
    const manager = await createManager();
    const res = await request(app)
      .put('/api/lenses/64b7f0000000000000000000')
      .set(authHeader(manager))
      .send({ price: 200 });
    expect(res.status).toBe(404);
  });

  it('cập nhật discountPrice hợp lệ -> 200', async () => {
    const manager = await createManager();
    const lens = await createLens({ price: 500 });
    const res = await request(app)
      .put(`/api/lenses/${lens._id}`)
      .set(authHeader(manager))
      .send({ discountPrice: 400 });
    expect(res.status).toBe(200);
    expect(res.body.data.discountPrice).toBe(400);
  });
});

describe('DELETE /api/lenses/:id (xóa mềm)', () => {
  it('chuyển status sang INACTIVE, không xóa bản ghi', async () => {
    const manager = await createManager();
    const lens = await createLens({ status: 'ACTIVE' });
    const res = await request(app)
      .delete(`/api/lenses/${lens._id}`)
      .set(authHeader(manager));
    expect(res.status).toBe(200);
    const inDb = await Lens.findById(lens._id);
    expect(inDb).not.toBeNull();
    expect(inDb.status).toBe('INACTIVE');
  });

  it('lens không tồn tại -> 404', async () => {
    const manager = await createManager();
    const res = await request(app)
      .delete('/api/lenses/64b7f0000000000000000000')
      .set(authHeader(manager));
    expect(res.status).toBe(404);
  });
});
