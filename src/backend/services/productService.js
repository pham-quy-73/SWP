import { Readable } from 'stream';
import cloudinary from '../config/cloudinaryConfig.js';
import Product from '../models/Product.js';

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

const uploadToCloudinary = (fileBuffer, folder = 'products') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

const getAllProducts = async ({ page = 1, limit = DEFAULT_LIMIT, search, minPrice, maxPrice } = {}) => {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || DEFAULT_LIMIT), MAX_LIMIT);
  const skip = (safePage - 1) * safeLimit;

  const filter = { deleted_at: null };

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [{ name: regex }, { brand: regex }];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
  }

  const [products, total] = await Promise.all([
    Product.find(filter).skip(skip).limit(safeLimit).sort({ createdAt: -1 }).lean(),
    Product.countDocuments(filter)
  ]);

  return {
    products,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit)
    }
  };
};

const getProductById = async (id) => {
  const product = await Product.findOne({ _id: id, deleted_at: null }).lean();
  return product;
};

const createProduct = async (payload, fileBuffer) => {
  let uploadResult = null;

  // Upload ảnh trước; nếu upload fail thì không đụng tới DB
  uploadResult = await uploadToCloudinary(fileBuffer);

  let product;
  try {
    product = await Product.create({
      ...payload,
      image_url: uploadResult.secure_url,
      image_public_id: uploadResult.public_id
    });
  } catch (dbError) {
    // Rollback: xóa ảnh vừa upload để tránh ảnh treo (orphaned) trên Cloudinary khi lưu DB lỗi
    await cloudinary.uploader.destroy(uploadResult.public_id);
    throw dbError;
  }

  return product;
};

const updateProduct = async (id, payload, fileBuffer) => {
  const existing = await Product.findOne({ _id: id, deleted_at: null });
  if (!existing) return null;

  const updateData = { ...payload };

  if (fileBuffer) {
    // Upload ảnh mới trước
    const uploadResult = await uploadToCloudinary(fileBuffer);
    const oldPublicId = existing.image_public_id;

    updateData.image_url = uploadResult.secure_url;
    updateData.image_public_id = uploadResult.public_id;

    const updated = await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    // Xóa ảnh cũ sau khi update DB thành công; lỗi destroy chỉ log, không làm hỏng request
    if (oldPublicId) {
      cloudinary.uploader.destroy(oldPublicId).catch((err) => {
        console.error('Không thể xóa ảnh cũ Cloudinary:', oldPublicId, err.message);
      });
    }

    return updated;
  }

  // Không có ảnh mới → chỉ update text, giữ nguyên ảnh hiện tại
  return Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
};

const softDeleteProduct = async (id) => {
  // Xóa mềm: chỉ set deleted_at, không xóa cứng bản ghi (giữ lịch sử đơn hàng)
  const product = await Product.findOneAndUpdate(
    { _id: id, deleted_at: null },
    { deleted_at: new Date() },
    { new: true }
  );
  return product;
};

export default { getAllProducts, getProductById, createProduct, updateProduct, softDeleteProduct };
