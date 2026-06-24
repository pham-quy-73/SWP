import { jest } from '@jest/globals';
import { PassThrough } from 'stream';

// --- Mocks phải đặt TRƯỚC dynamic import ---

const mockUploadStream = jest.fn();
const mockDestroy = jest.fn().mockResolvedValue({ result: 'ok' });

jest.unstable_mockModule('../config/cloudinaryConfig.js', () => ({
  default: {
    uploader: {
      upload_stream: mockUploadStream,
      destroy: mockDestroy
    }
  }
}));

const mockProductCreate = jest.fn();
jest.unstable_mockModule('../models/Product.js', () => ({
  default: {
    create: mockProductCreate
  }
}));

// Dynamic import sau khi đã đăng ký mock (bắt buộc với ESM)
const { default: productService } = await import('./productService.js');

// --- Test helpers ---
const FAKE_UPLOAD_RESULT = {
  secure_url: 'https://res.cloudinary.com/demo/products/test.jpg',
  public_id: 'products/test_id'
};

const FAKE_PAYLOAD = { name: 'Gọng kính Test', brand: 'Ray-Ban', price: 500000, stock_quantity: 10 };
const FAKE_FILE_BUFFER = Buffer.from('fake-image-bytes');

const setupUploadMock = (result = FAKE_UPLOAD_RESULT, error = null) => {
  mockUploadStream.mockImplementation((_opts, callback) => {
    const pt = new PassThrough();
    setImmediate(() => callback(error, result));
    return pt;
  });
};

// ---

describe('productService.createProduct', () => {
  beforeEach(() => jest.clearAllMocks());

  test('test_create_product_with_image — happy path', async () => {
    const fakeProduct = {
      _id: 'abc123',
      ...FAKE_PAYLOAD,
      image_url: FAKE_UPLOAD_RESULT.secure_url,
      image_public_id: FAKE_UPLOAD_RESULT.public_id
    };

    setupUploadMock();
    mockProductCreate.mockResolvedValue(fakeProduct);

    const result = await productService.createProduct(FAKE_PAYLOAD, FAKE_FILE_BUFFER);

    expect(result).toEqual(fakeProduct);
    expect(mockUploadStream).toHaveBeenCalledTimes(1);
    expect(mockProductCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        image_url: FAKE_UPLOAD_RESULT.secure_url,
        image_public_id: FAKE_UPLOAD_RESULT.public_id
      })
    );
    // Không có rollback khi thành công
    expect(mockDestroy).not.toHaveBeenCalled();
  });

  test('test_rollback_on_db_fail — DB sập sau upload ảnh phải gọi cloudinary destroy', async () => {
    setupUploadMock();
    mockProductCreate.mockRejectedValue(new Error('MongoNetworkError: connection refused'));

    await expect(
      productService.createProduct(FAKE_PAYLOAD, FAKE_FILE_BUFFER)
    ).rejects.toThrow('MongoNetworkError');

    // Rollback: destroy ảnh đã upload tránh orphaned image
    expect(mockDestroy).toHaveBeenCalledTimes(1);
    expect(mockDestroy).toHaveBeenCalledWith(FAKE_UPLOAD_RESULT.public_id);
  });
});
