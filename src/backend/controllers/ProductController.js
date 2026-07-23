import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';
import { httpError } from '../middlewares/errorMiddleware.js';

// Escape ký tự đặc biệt trước khi đưa user input vào $regex
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isStaff = (user) => ['MANAGER', 'ADMIN'].includes(user?.role);

// Whitelist sort server-side (không làm tính năng giảm giá nên chỉ sort theo price gốc)
const SORT_OPTIONS = {
  'newest': { createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
};

// Best-effort xóa file ảnh cục bộ dưới uploads/ (bỏ qua URL ngoài và lỗi I/O)
const removeLocalImages = (imageDocs = []) => {
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  for (const img of imageDocs) {
    const url = typeof img === 'string' ? img : img?.imageUrl;
    if (url && url.startsWith('/uploads/')) {
      const targetPath = path.resolve(process.cwd(), url.slice(1));
      if (targetPath.startsWith(uploadsDir + path.sep)) {
        fs.promises.unlink(targetPath).catch(() => {});
      }
    }
  }
};

class ProductController {

  async getProducts(req, res, next) {
    try {
      const {
        page = 1, limit = 10, search, category, brand, gender, shape,
        frameMaterial, frameType, minPrice, maxPrice, status, sortBy
      } = req.query;

      // Quyền xem suy ra từ token (optionalAuthenticate), không tin cờ client gửi lên
      const staff = isStaff(req.user);
      const query = {};

      // 1. Lọc theo trạng thái — khách hàng luôn bị khóa ở ACTIVE
      if (staff && status === 'ALL') {
        // Quản lý xem tất cả
      } else if (staff && status) {
        query.status = status;
      } else {
        query.status = 'ACTIVE';
      }

      // 2. Lọc theo danh mục nếu client chỉ định.
      // Tròng kính (Lens) là model riêng, phục vụ qua /api/lenses — API sản phẩm
      // chỉ trả về gọng/kính râm, không còn dính dáng gì tới LENS.
      if (category) {
        query.category = category;
      }

      // 3. Các bộ lọc khác
      if (search) {
        const pattern = escapeRegex(search);
        query.$or = [
          { name: { $regex: pattern, $options: 'i' } },
          { brand: { $regex: pattern, $options: 'i' } }
        ];
      }
      if (brand) query.brand = { $regex: escapeRegex(brand), $options: 'i' };
      if (gender) {
        const genderVal = Array.isArray(gender) ? gender[0] : gender;
        if (genderVal && typeof genderVal === 'string') {
          query.gender = genderVal.toUpperCase();
        }
      }
      if (shape) query.shape = { $regex: escapeRegex(shape), $options: 'i' };
      if (frameMaterial) query.frameMaterial = { $regex: escapeRegex(frameMaterial), $options: 'i' };
      if (frameType) query.frameType = frameType;

      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
      }

      const sort = SORT_OPTIONS[sortBy] || SORT_OPTIONS.newest;
      const skip = (Number(page) - 1) * Number(limit);
      const totalElements = await Product.countDocuments(query);
      const totalPages = Math.ceil(totalElements / Number(limit));

      const items = await Product.find(query).skip(skip).limit(Number(limit)).sort(sort);

      res.status(200).json({
        code: 0,
        result: { items, page: Number(page) - 1, size: items.length, totalElements, totalPages }
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req, res, next) {
    try {
      const product = await Product.findById(req.params.id);
      // Khách hàng không xem được sản phẩm đã ngừng bán (trả 404 để không lộ tồn tại)
      if (!product || (product.status === 'INACTIVE' && !isStaff(req.user))) {
        return next(httpError(404, 'NOT_FOUND', 'Không tìm thấy sản phẩm'));
      }
      res.status(200).json(product);
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      let productData = req.body;
      if (req.body.product && typeof req.body.product === 'string') {
        productData = JSON.parse(req.body.product);
      }

      if (!productData.name || !productData.brand || productData.price === undefined) {
        return next(httpError(400, 'VALIDATION_ERROR', 'Thiếu thông tin bắt buộc: Name, Brand hoặc Price!'));
      }

      if (productData.imageUrl && Array.isArray(productData.imageUrl)) {
        productData.imageUrl = productData.imageUrl.map(img => (typeof img === 'string' ? { imageUrl: img } : img));
      } else {
        productData.imageUrl = [];
      }

      if (req.files && req.files.length > 0) {
        const imageUrls = req.files.map(file => ({
          imageUrl: `/${(file.path || file.filename).replace(/\\/g, '/')}`
        }));
        productData.imageUrl = [...productData.imageUrl, ...imageUrls];
      } else if (productData.imageUrl.length === 0) {
        productData.imageUrl = [{ imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800' }];
      }

      if (productData.price !== undefined) productData.price = Number(productData.price);
      if (productData.discountPrice !== undefined) productData.discountPrice = Number(productData.discountPrice);
      if (productData.weightGram !== undefined) productData.weightGram = Number(productData.weightGram);

      const product = new Product(productData);
      await product.save();

      res.status(201).json({ code: 0, result: product });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);
      if (!product) return next(httpError(404, 'NOT_FOUND', 'Không tìm thấy sản phẩm'));

      let updateData = req.body;
      if (req.body.product && typeof req.body.product === 'string') {
        updateData = JSON.parse(req.body.product);
      }

      let currentImages = [];
      let shouldUpdateImages = false;

      if ('imageUrl' in updateData && Array.isArray(updateData.imageUrl)) {
        currentImages = updateData.imageUrl.map(img => (typeof img === 'string' ? { imageUrl: img } : img));
        shouldUpdateImages = true;
      }

      if (req.files && req.files.length > 0) {
        const newImageUrls = req.files.map(file => ({
          imageUrl: `/${(file.path || file.filename).replace(/\\/g, '/')}`
        }));
        const baseImages = shouldUpdateImages ? currentImages : product.imageUrl;
        currentImages = [...baseImages, ...newImageUrls];
        shouldUpdateImages = true;
      }

      if (shouldUpdateImages) {
        // Find local images to delete (present in original product but not in updated list)
        const oldUrls = product.imageUrl.map(img => (typeof img === 'string' ? img : img?.imageUrl)).filter(Boolean);
        const newUrls = new Set(currentImages.map(img => (typeof img === 'string' ? img : img?.imageUrl)).filter(Boolean));
        
        const removedImages = oldUrls.filter(url => !newUrls.has(url));
        if (removedImages.length > 0) {
          removeLocalImages(removedImages);
        }

        updateData.imageUrl = currentImages;
      } else {
        delete updateData.imageUrl;
      }

      if (updateData.price !== undefined) updateData.price = Number(updateData.price);
      if (updateData.discountPrice !== undefined) updateData.discountPrice = Number(updateData.discountPrice);
      if (updateData.weightGram !== undefined) updateData.weightGram = Number(updateData.weightGram);

      const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

      res.status(200).json({ code: 0, result: updatedProduct });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);
      if (!product) return next(httpError(404, 'NOT_FOUND', 'Không tìm thấy sản phẩm'));

      const executeDeletion = async (session) => {
        const variants = await ProductVariant.find({ productId: id }).session(session);
        await ProductVariant.deleteMany({ productId: id }, { session });
        await Product.findByIdAndDelete(id, { session });
        return { product, variants };
      };

      let result = null;
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          result = await executeDeletion(session);
        });
      } catch (txnError) {
        if (txnError.message.includes('Transaction numbers') || txnError.code === 20) {
          console.warn('[DB Warning] MongoDB is running in standalone mode. Executing product deletion without transaction.');
          result = await executeDeletion(null);
        } else {
          throw txnError;
        }
      } finally {
        await session.endSession();
      }

      if (result) {
        removeLocalImages(result.product.imageUrl);
        result.variants.forEach(variant => removeLocalImages(variant.imageUrl));
      }

      res.status(200).json({ code: 0, message: 'Xóa sản phẩm thành công' });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductController();
