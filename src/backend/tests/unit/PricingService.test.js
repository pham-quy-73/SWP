import { describe, it, expect } from 'vitest';
import { priceOrderItem, PricingError } from '../../services/PricingService.js';
import { createProduct, createLens, createVariant } from '../helpers/factories.js';

describe('PricingService.priceOrderItem', () => {
  describe('happy path', () => {
    it('prices a variant by its base price when no discount', async () => {
      const product = await createProduct({ price: 2000 });
      const variant = await createVariant(product, { price: 1500, quantity: 5 });

      const { variant: got, basePrice, lensPrice, finalUnitPrice } = await priceOrderItem({
        variantId: variant._id,
        quantity: 1
      });

      expect(got._id.toString()).toBe(variant._id.toString());
      expect(basePrice).toBe(1500);
      expect(lensPrice).toBe(0);
      expect(finalUnitPrice).toBe(1500);
    });

    it('prefers variant discountPrice when it is > 0', async () => {
      const product = await createProduct();
      const variant = await createVariant(product, { price: 1500, discountPrice: 999 });

      const { basePrice, finalUnitPrice } = await priceOrderItem({ variantId: variant._id, quantity: 1 });

      expect(basePrice).toBe(999);
      expect(finalUnitPrice).toBe(999);
    });

    it('adds lens price when lensId provided (active LENS product)', async () => {
      const product = await createProduct();
      const variant = await createVariant(product, { price: 1000 });
      const lens = await createLens({ price: 400 });

      const { basePrice, lensPrice, finalUnitPrice } = await priceOrderItem({
        variantId: variant._id,
        lensId: lens._id,
        quantity: 1
      });

      expect(basePrice).toBe(1000);
      expect(lensPrice).toBe(400);
      expect(finalUnitPrice).toBe(1400);
    });

    it('uses lens discountPrice when set', async () => {
      const product = await createProduct();
      const variant = await createVariant(product, { price: 1000 });
      const lens = await createLens({ price: 400, discountPrice: 250 });

      const { lensPrice, finalUnitPrice } = await priceOrderItem({
        variantId: variant._id,
        lensId: lens._id,
        quantity: 1
      });

      expect(lensPrice).toBe(250);
      expect(finalUnitPrice).toBe(1250);
    });
  });

  describe('id field aliases', () => {
    it('accepts productVariantId alias', async () => {
      const product = await createProduct();
      const variant = await createVariant(product, { price: 1200 });
      const { finalUnitPrice } = await priceOrderItem({ productVariantId: variant._id, quantity: 1 });
      expect(finalUnitPrice).toBe(1200);
    });

    it('falls back to first ACTIVE variant when productId points to a Product', async () => {
      const product = await createProduct();
      const variant = await createVariant(product, { price: 1300, status: 'ACTIVE' });
      // productId is a Product id, not a variant id -> triggers fallback query
      const { variant: got, finalUnitPrice } = await priceOrderItem({ productId: product._id, quantity: 1 });
      expect(got._id.toString()).toBe(variant._id.toString());
      expect(finalUnitPrice).toBe(1300);
    });
  });

  describe('discountPrice boundary values', () => {
    it('treats discountPrice of 0 as no discount (uses base price)', async () => {
      const product = await createProduct();
      const variant = await createVariant(product, { price: 1000, discountPrice: 0 });
      const { basePrice } = await priceOrderItem({ variantId: variant._id, quantity: 1 });
      expect(basePrice).toBe(1000);
    });

    it('applies discountPrice when exactly 1 (just above the 0 boundary)', async () => {
      const product = await createProduct();
      const variant = await createVariant(product, { price: 1000, discountPrice: 1 });
      const { basePrice } = await priceOrderItem({ variantId: variant._id, quantity: 1 });
      expect(basePrice).toBe(1);
    });
  });

  describe('error handling', () => {
    it('throws PricingError(400, VARIANT_NOT_FOUND) when variant missing', async () => {
      const missingId = '507f1f77bcf86cd799439011';
      await expect(priceOrderItem({ variantId: missingId, quantity: 1 })).rejects.toBeInstanceOf(PricingError);
      await priceOrderItem({ variantId: missingId, quantity: 1 }).catch((err) => {
        expect(err.status).toBe(400);
        expect(err.body.error_code).toBe('VARIANT_NOT_FOUND');
      });
    });

    it('throws INVALID_LENS when lensId is not a LENS category', async () => {
      const product = await createProduct();
      const variant = await createVariant(product, { price: 1000 });
      const notLens = await createProduct({ category: 'FRAME' });

      await expect(
        priceOrderItem({ variantId: variant._id, lensId: notLens._id, quantity: 1 })
      ).rejects.toMatchObject({ status: 400, body: { error_code: 'INVALID_LENS' } });
    });

    it('throws INVALID_LENS when lens is INACTIVE', async () => {
      const product = await createProduct();
      const variant = await createVariant(product, { price: 1000 });
      const lens = await createLens({ price: 400, status: 'INACTIVE' });

      await expect(
        priceOrderItem({ variantId: variant._id, lensId: lens._id, quantity: 1 })
      ).rejects.toMatchObject({ status: 400, body: { error_code: 'INVALID_LENS' } });
    });

    it('throws INVALID_LENS when lensId does not exist', async () => {
      const product = await createProduct();
      const variant = await createVariant(product, { price: 1000 });

      await expect(
        priceOrderItem({ variantId: variant._id, lensId: '507f1f77bcf86cd799439099', quantity: 1 })
      ).rejects.toMatchObject({ status: 400, body: { error_code: 'INVALID_LENS' } });
    });
  });

  describe('PricingError', () => {
    it('carries status and body, and sets message from body', () => {
      const err = new PricingError(400, { error_code: 'X', message: 'boom' });
      expect(err).toBeInstanceOf(Error);
      expect(err.status).toBe(400);
      expect(err.body.error_code).toBe('X');
      expect(err.message).toBe('boom');
    });
  });
});
