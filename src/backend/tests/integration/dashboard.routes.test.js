import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import {
  authHeader, createAdmin, createManager, createCustomer,
  createOrder, createProduct, createVariant
} from '../helpers/factories.js';

const app = createApp();

describe('GET /api/dashboard/revenue', () => {
  it('không đăng nhập -> 401', async () => {
    const res = await request(app).get('/api/dashboard/revenue');
    expect(res.status).toBe(401);
  });

  it('customer bị chặn -> 403', async () => {
    const customer = await createCustomer();
    const res = await request(app).get('/api/dashboard/revenue').set(authHeader(customer));
    expect(res.status).toBe(403);
  });

  it('manager xem được thống kê', async () => {
    const manager = await createManager();
    const user = await createCustomer();
    await createOrder(user, { status: 'COMPLETED', total_amount: 5000 });
    await createOrder(user, { status: 'COMPLETED', total_amount: 3000 });
    await createOrder(user, { status: 'PENDING', total_amount: 1000 });

    const res = await request(app).get('/api/dashboard/revenue').set(authHeader(manager));
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(1000);
    expect(res.body.result.revenue).toBe(8000);
    expect(res.body.result.activeOrders).toBeGreaterThanOrEqual(1);
  });

  it('đếm sản phẩm tồn kho thấp (<10)', async () => {
    const admin = await createAdmin();
    const p = await createProduct();
    await createVariant(p, { quantity: 5, status: 'ACTIVE' });
    await createVariant(p, { quantity: 50, status: 'ACTIVE' });
    const res = await request(app).get('/api/dashboard/revenue').set(authHeader(admin));
    expect(res.status).toBe(200);
    expect(res.body.result.lowStockItems).toBe(1);
  });

  it('không có đơn hoàn thành -> revenue 0', async () => {
    const admin = await createAdmin();
    const res = await request(app).get('/api/dashboard/revenue').set(authHeader(admin));
    expect(res.status).toBe(200);
    expect(res.body.result.revenue).toBe(0);
    expect(res.body.result.revenueGrowth).toBe(0);
  });
});
