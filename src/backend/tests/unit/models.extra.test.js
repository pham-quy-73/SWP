import { describe, it, expect, vi } from 'vitest';
import mongoose from 'mongoose';
import Verification from '../../models/Verification.js';
import { createCustomer, createManager, createOrder } from '../helpers/factories.js';

describe('Model Verification', () => {
  it('tạo bản ghi duyệt đơn hợp lệ (APPROVE)', async () => {
    const customer = await createCustomer();
    const manager = await createManager();
    const order = await createOrder(customer);

    const v = await Verification.create({
      order_id: order._id,
      verified_by: manager._id,
      status: 'APPROVE',
      note: 'Toa thuốc hợp lệ'
    });
    expect(v.status).toBe('APPROVE');
    expect(v.note).toBe('Toa thuốc hợp lệ');
    expect(v.createdAt).toBeInstanceOf(Date);
  });

  it('status ngoài enum APPROVE/REJECT -> ValidationError', async () => {
    const customer = await createCustomer();
    const manager = await createManager();
    const order = await createOrder(customer);

    await expect(Verification.create({
      order_id: order._id,
      verified_by: manager._id,
      status: 'MAYBE'
    })).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('thiếu order_id / verified_by -> ValidationError', async () => {
    await expect(Verification.create({ status: 'REJECT' }))
      .rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('note mặc định chuỗi rỗng', async () => {
    const customer = await createCustomer();
    const manager = await createManager();
    const order = await createOrder(customer);
    const v = await Verification.create({
      order_id: order._id,
      verified_by: manager._id,
      status: 'REJECT'
    });
    expect(v.note).toBe('');
  });
});

describe('MailService — cảnh báo thiếu cấu hình SMTP', () => {
  it('constructor cảnh báo khi thiếu SMTP_USER/SMTP_PASS', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const savedUser = process.env.SMTP_USER;
    const savedPass = process.env.SMTP_PASS;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    // Nạp lại module để constructor chạy lại với env thiếu
    vi.resetModules();
    await import('../../services/MailService.js?warn-branch');

    process.env.SMTP_USER = savedUser;
    process.env.SMTP_PASS = savedPass;
    expect(warnSpy).toHaveBeenCalled();
    expect(String(warnSpy.mock.calls[0][0])).toContain('SMTP');
    warnSpy.mockRestore();
  });
});
