import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import ProductVariant from '../../models/ProductVariant.js';
import {
  authHeader, createManager, createCustomer, createProduct, createVariant
} from '../helpers/factories.js';

const app = createApp();

describe('GET /api/products/:productId/variants', () => {
  it('trả về danh sách biến thể của sản phẩm', async () => {
    const product = await createProduct();
    await createVariant(product, { colorName: 'Black' });
    await createVariant(product, { colorName: 'Red' });
    const res = await request(app).get(`/api/products/${product._id}/variants`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.result).toHaveLength(2);
  });

  it('sản phẩm không có biến thể -> mảng rỗng', async () => {
    const product = await createProduct();
    const res = await request(app).get(`/api/products/${product._id}/variants`);
    expect(res.status).toBe(200);
    expect(res.body.result).toHaveLength(0);
  });
});

describe('POST /api/products/:productId/variants', () => {
  it('không đăng nhập -> 401', async () => {
    const product = await createProduct();
    const res = await request(app).post(`/api/products/${product._id}/variants`).send({});
    expect(res.status).toBe(401);
  });

  it('customer -> 403', async () => {
    const customer = await createCustomer();
    const product = await createProduct();
    const res = await request(app)
      .post(`/api/products/${product._id}/variants`)
      .set(authHeader(customer))
      .field('variant', JSON.stringify({ sku: 'X' }));
    expect(res.status).toBe(403);
  });

  it('manager tạo biến thể qua field variant (JSON) -> 201', async () => {
    const manager = await createManager();
    const product = await createProduct();
    const res = await request(app)
      .post(`/api/products/${product._id}/variants`)
      .set(authHeader(manager))
      .field('variant', JSON.stringify({
        sku: 'SKU-NEW', colorName: 'Blue', price: 1200, quantity: 7, discountPrice: 999
      }));
    expect(res.status).toBe(201);
    expect(res.body.result.sku).toBe('SKU-NEW');
    expect(res.body.result.discountPrice).toBe(999);
    const inDb = await ProductVariant.findById(res.body.result._id);
    expect(inDb.quantity).toBe(7);
  });

  it('sản phẩm cha không tồn tại -> 404', async () => {
    const manager = await createManager();
    const res = await request(app)
      .post('/api/products/64b7f0000000000000000000/variants')
      .set(authHeader(manager))
      .field('variant', JSON.stringify({ sku: 'X', price: 100 }));
    expect(res.status).toBe(404);
  });

  it('tạo biến thể kèm upload ảnh -> lưu imageUrl từ file', async () => {
    const manager = await createManager();
    const product = await createProduct();
    const res = await request(app)
      .post(`/api/products/${product._id}/variants`)
      .set(authHeader(manager))
      .field('variant', JSON.stringify({ sku: 'IMG', price: 500 }))
      .attach('files', Buffer.from('89504e470d0a1a0a', 'hex'), { filename: 'v.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(res.body.result.imageUrl).toHaveLength(1);
    expect(res.body.result.imageUrl[0].imageUrl).toContain('/uploads/');
  });
});

describe('PUT /api/products/:productId/variants/:variantId', () => {
  it('cập nhật biến thể -> 200', async () => {
    const manager = await createManager();
    const product = await createProduct();
    const variant = await createVariant(product, { price: 1000, quantity: 5 });
    const res = await request(app)
      .put(`/api/products/${product._id}/variants/${variant._id}`)
      .set(authHeader(manager))
      .field('variant', JSON.stringify({ price: 2000, quantity: 20, colorName: 'Green' }));
    expect(res.status).toBe(200);
    expect(res.body.result.price).toBe(2000);
    expect(res.body.result.quantity).toBe(20);
  });

  it('cập nhật biến thể kèm ảnh cũ (mảng) + ảnh mới upload', async () => {
    const manager = await createManager();
    const product = await createProduct();
    const variant = await createVariant(product, { price: 1000 });
    const res = await request(app)
      .put(`/api/products/${product._id}/variants/${variant._id}`)
      .set(authHeader(manager))
      .field('variant', JSON.stringify({ price: 1500, imageUrl: ['http://old/img.jpg'] }))
      .attach('files', Buffer.from('89504e470d0a1a0a', 'hex'), { filename: 'new.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    expect(res.body.result.imageUrl).toHaveLength(2);
  });

  it('cập nhật đầy đủ mọi trường số (nhánh !== undefined)', async () => {
    const manager = await createManager();
    const product = await createProduct();
    const variant = await createVariant(product);
    const res = await request(app)
      .put(`/api/products/${product._id}/variants/${variant._id}`)
      .set(authHeader(manager))
      .field('variant', JSON.stringify({
        sku: 'FULL', colorName: 'Gold', frameFinish: 'Matte', sizeLabel: 'L',
        lensWidthMm: 55, bridgeWidthMm: 20, templeLengthMm: 145,
        price: 3000, discountPrice: 2500, quantity: 42,
        status: 'ACTIVE', orderItemType: 'IN_STOCK'
      }));
    expect(res.status).toBe(200);
    expect(res.body.result.lensWidthMm).toBe(55);
    expect(res.body.result.discountPrice).toBe(2500);
    expect(res.body.result.quantity).toBe(42);
  });

  it('biến thể không tồn tại -> 404', async () => {
    const manager = await createManager();
    const product = await createProduct();
    const res = await request(app)
      .put(`/api/products/${product._id}/variants/64b7f0000000000000000000`)
      .set(authHeader(manager))
      .field('variant', JSON.stringify({ price: 100 }));
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/products/:productId/variants/:variantId', () => {
  it('xóa biến thể -> 200', async () => {
    const manager = await createManager();
    const product = await createProduct();
    const variant = await createVariant(product);
    const res = await request(app)
      .delete(`/api/products/${product._id}/variants/${variant._id}`)
      .set(authHeader(manager));
    expect(res.status).toBe(200);
    expect(await ProductVariant.findById(variant._id)).toBeNull();
  });

  it('biến thể không tồn tại -> 404', async () => {
    const manager = await createManager();
    const product = await createProduct();
    const res = await request(app)
      .delete(`/api/products/${product._id}/variants/64b7f0000000000000000000`)
      .set(authHeader(manager));
    expect(res.status).toBe(404);
  });
});
