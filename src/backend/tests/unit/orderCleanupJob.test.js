import { describe, it, expect, vi } from 'vitest';
import { cleanupExpiredOrders, startOrderStatusCleanupJob } from '../../jobs/orderCleanupJob.js';
import Order from '../../models/Order.js';
import ProductVariant from '../../models/ProductVariant.js';
import {
  createCustomer, createProduct, createVariant, createOrder, createOrderItem
} from '../helpers/factories.js';

describe('orderCleanupJob.cleanupExpiredOrders', () => {
  it('hủy đơn PENDING quá hạn 15 phút và hoàn trả tồn kho', async () => {
    const user = await createCustomer();
    const product = await createProduct();
    const variant = await createVariant(product, { quantity: 5 });
    const order = await createOrder(user, { status: 'PENDING' });
    await createOrderItem(order, { product_id: product._id, variant_id: variant._id, quantity: 3 });

    // Ép created_at về quá khứ 20 phút (vượt ngưỡng 15 phút)
    await Order.collection.updateOne({ _id: order._id }, { $set: { created_at: new Date(Date.now() - 20 * 60 * 1000) } });

    const cancelled = await cleanupExpiredOrders();

    expect(cancelled).toBe(1);
    const updated = await Order.findById(order._id);
    expect(updated.status).toBe('CANCELLED');
    const v = await ProductVariant.findById(variant._id);
    expect(v.quantity).toBe(8); // 5 + 3 hoàn trả
  });

  it('bỏ qua đơn PENDING còn trong hạn', async () => {
    const user = await createCustomer();
    await createOrder(user, { status: 'PENDING' }); // created_at = now
    const cancelled = await cleanupExpiredOrders();
    expect(cancelled).toBe(0);
  });

  it('không đụng tới đơn đã CONFIRMED dù quá hạn', async () => {
    const user = await createCustomer();
    const order = await createOrder(user, { status: 'CONFIRMED' });
    await Order.collection.updateOne({ _id: order._id }, { $set: { created_at: new Date(Date.now() - 60 * 60 * 1000) } });
    const cancelled = await cleanupExpiredOrders();
    expect(cancelled).toBe(0);
    const updated = await Order.findById(order._id);
    expect(updated.status).toBe('CONFIRMED');
  });

  it('trả về 0 khi không có đơn nào', async () => {
    expect(await cleanupExpiredOrders()).toBe(0);
  });

  it('bỏ qua order item không có variant_id (không crash)', async () => {
    const user = await createCustomer();
    const product = await createProduct();
    const order = await createOrder(user, { status: 'PENDING' });
    await createOrderItem(order, { product_id: product._id, variant_id: undefined, quantity: 2 });
    await Order.collection.updateOne({ _id: order._id }, { $set: { created_at: new Date(Date.now() - 20 * 60 * 1000) } });
    const cancelled = await cleanupExpiredOrders();
    expect(cancelled).toBe(1);
  });
});

describe('orderCleanupJob.startOrderStatusCleanupJob', () => {
  it('trả về handle interval và chạy cleanup theo lịch', async () => {
    vi.useFakeTimers();
    try {
      const handle = startOrderStatusCleanupJob();
      expect(handle).toBeDefined();
      // Tua 5 phút để trigger 1 lần quét (không throw)
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
      clearInterval(handle);
    } finally {
      vi.useRealTimers();
    }
  });
});
