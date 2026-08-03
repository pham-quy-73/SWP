import { describe, it, expect } from 'vitest';
import request from 'supertest';
import XLSX from 'xlsx';
import { createApp } from '../../app.js';
import ProductVariant from '../../models/ProductVariant.js';
import {
  authHeader, createManager, createCustomer, createProduct, createVariant
} from '../helpers/factories.js';

const app = createApp();

/** Tạo buffer file .xlsx từ mảng object (mỗi object = 1 dòng) */
function makeExcelBuffer(rows) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Variants');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function importReq(product, manager) {
  return request(app)
    .post(`/api/products/${product._id}/variants/import-excel`)
    .set(authHeader(manager));
}

describe('POST /api/products/:productId/variants/import-excel', () => {
  it('không đăng nhập -> 401', async () => {
    const product = await createProduct();
    const res = await request(app).post(`/api/products/${product._id}/variants/import-excel`);
    expect(res.status).toBe(401);
  });

  it('customer -> 403', async () => {
    const customer = await createCustomer();
    const product = await createProduct();
    const res = await request(app)
      .post(`/api/products/${product._id}/variants/import-excel`)
      .set(authHeader(customer));
    expect(res.status).toBe(403);
  });

  it('sản phẩm không tồn tại -> 404', async () => {
    const manager = await createManager();
    const buf = makeExcelBuffer([{ colorName: 'Black', price: 100 }]);
    const res = await request(app)
      .post('/api/products/64b7f0000000000000000000/variants/import-excel')
      .set(authHeader(manager))
      .attach('file', buf, { filename: 'v.xlsx', contentType: XLSX_MIME });
    expect(res.status).toBe(404);
  });

  it('không đính kèm file -> 400', async () => {
    const manager = await createManager();
    const product = await createProduct();
    const res = await importReq(product, manager);
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Excel');
  });

  it('file Excel rỗng -> 400', async () => {
    const manager = await createManager();
    const product = await createProduct();
    const buf = makeExcelBuffer([]);
    const res = await importReq(product, manager)
      .attach('file', buf, { filename: 'empty.xlsx', contentType: XLSX_MIME });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('rỗng');
  });

  it('import tạo mới biến thể từ header tiếng Anh -> 200 + createdCount', async () => {
    const manager = await createManager();
    const product = await createProduct();
    const buf = makeExcelBuffer([
      { colorName: 'Black', sku: 'SKU-B1', price: 1500, quantity: 10, lensWidthMm: 52 },
      { colorName: 'Gold', sku: 'SKU-G1', price: 2500, quantity: 5, discountPrice: 2000 }
    ]);
    const res = await importReq(product, manager)
      .attach('file', buf, { filename: 'new.xlsx', contentType: XLSX_MIME });
    expect(res.status).toBe(200);
    expect(res.body.createdCount).toBe(2);
    expect(res.body.updatedCount).toBe(0);
    expect(res.body.message).toContain('thêm mới');
    const inDb = await ProductVariant.find({ productId: product._id });
    expect(inDb).toHaveLength(2);
    const gold = inDb.find(v => v.colorName === 'Gold');
    expect(gold.discountPrice).toBe(2000);
  });

  it('import với header tiếng Việt -> 200', async () => {
    const manager = await createManager();
    const product = await createProduct();
    const buf = makeExcelBuffer([{
      'Màu sắc': 'Đen nhám',
      'Mã SKU': 'SKU-VN1',
      'Hoàn thiện gọng': 'Matte',
      'Kích thước nhãn': 'L',
      'Chiều rộng tròng (mm)': 54,
      'Chiều rộng cầu (mm)': 19,
      'Chiều dài càng (mm)': 145,
      'Giá bán': 3200,
      'Giá giảm': 2900,
      'Số lượng tồn kho': 8,
      'Loại kho': 'PRE_ORDER',
      'Trạng thái': 'INACTIVE'
    }]);
    const res = await importReq(product, manager)
      .attach('file', buf, { filename: 'vn.xlsx', contentType: XLSX_MIME });
    expect(res.status).toBe(200);
    expect(res.body.createdCount).toBe(1);
    const v = await ProductVariant.findOne({ productId: product._id, sku: 'SKU-VN1' });
    expect(v.colorName).toBe('Đen nhám');
    expect(v.frameFinish).toBe('Matte');
    expect(v.lensWidthMm).toBe(54);
    expect(v.discountPrice).toBe(2900);
    expect(v.orderItemType).toBe('PRE_ORDER');
    expect(v.status).toBe('INACTIVE');
  });

  it('trùng SKU/màu với biến thể có sẵn -> cập nhật thay vì tạo mới', async () => {
    const manager = await createManager();
    const product = await createProduct();
    await createVariant(product, { sku: 'SKU-DUP', colorName: 'Black', price: 1000, quantity: 3 });
    const buf = makeExcelBuffer([
      { colorName: 'Black', sku: 'SKU-DUP', price: 1800, quantity: 30 }
    ]);
    const res = await importReq(product, manager)
      .attach('file', buf, { filename: 'dup.xlsx', contentType: XLSX_MIME });
    expect(res.status).toBe(200);
    expect(res.body.updatedCount).toBe(1);
    expect(res.body.createdCount).toBe(0);
    expect(res.body.message).toContain('cập nhật');
    const inDb = await ProductVariant.find({ productId: product._id });
    expect(inDb).toHaveLength(1);
    expect(inDb[0].price).toBe(1800);
    expect(inDb[0].quantity).toBe(30);
  });

  it('vừa cập nhật vừa tạo mới -> message gộp cả hai', async () => {
    const manager = await createManager();
    const product = await createProduct();
    await createVariant(product, { sku: 'SKU-OLD', colorName: 'Black', price: 1000 });
    const buf = makeExcelBuffer([
      { colorName: 'Black', sku: 'SKU-OLD', price: 1100 },
      { colorName: 'Silver', sku: 'SKU-NEW2', price: 900 }
    ]);
    const res = await importReq(product, manager)
      .attach('file', buf, { filename: 'mix.xlsx', contentType: XLSX_MIME });
    expect(res.status).toBe(200);
    expect(res.body.updatedCount).toBe(1);
    expect(res.body.createdCount).toBe(1);
    expect(res.body.message).toContain('cập nhật');
    expect(res.body.message).toContain('thêm mới');
  });

  it('dòng thiếu màu sắc hoặc giá <= 0 -> ghi vào errors, dòng hợp lệ vẫn xử lý', async () => {
    const manager = await createManager();
    const product = await createProduct();
    const buf = makeExcelBuffer([
      { sku: 'NO-COLOR', price: 1000 },              // thiếu màu
      { colorName: 'BadPrice', price: 0 },           // giá không hợp lệ
      { colorName: 'NegPrice', price: -5 },          // giá âm
      { colorName: 'OK', sku: 'SKU-OK', price: 700 } // hợp lệ
    ]);
    const res = await importReq(product, manager)
      .attach('file', buf, { filename: 'partial.xlsx', contentType: XLSX_MIME });
    expect(res.status).toBe(200);
    expect(res.body.createdCount).toBe(1);
    expect(res.body.errors).toHaveLength(3);
    expect(res.body.errors[0]).toContain('Dòng 2');
    expect(res.body.errors.join(' ')).toContain('màu sắc');
    expect(res.body.errors.join(' ')).toContain('Giá bán không hợp lệ');
  });

  it('tất cả các dòng đều lỗi -> 400 + danh sách errors', async () => {
    const manager = await createManager();
    const product = await createProduct();
    const buf = makeExcelBuffer([
      { sku: 'X1', price: 1000 },
      { colorName: 'Y', price: 0 }
    ]);
    const res = await importReq(product, manager)
      .attach('file', buf, { filename: 'allbad.xlsx', contentType: XLSX_MIME });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toHaveLength(2);
    expect(await ProductVariant.countDocuments({ productId: product._id })).toBe(0);
  });

  it('không có SKU trong file -> tự sinh SKU từ tên màu', async () => {
    const manager = await createManager();
    const product = await createProduct();
    const buf = makeExcelBuffer([{ colorName: 'Rose', price: 650 }]);
    const res = await importReq(product, manager)
      .attach('file', buf, { filename: 'nosku.xlsx', contentType: XLSX_MIME });
    expect(res.status).toBe(200);
    const v = await ProductVariant.findOne({ productId: product._id });
    expect(v.sku).toMatch(/^SKU-ROSE-\d{4}$/);
  });
});
