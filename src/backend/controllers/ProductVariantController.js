import ProductVariant from '../models/ProductVariant.js';
import Product from '../models/Product.js';
import { httpError } from '../middlewares/errorMiddleware.js';

class ProductVariantController {
  async getVariants(req, res, next) {
    try {
      const { productId } = req.params;
      const variants = await ProductVariant.find({ productId });
      return res.status(200).json({ success: true, result: variants });
    } catch (error) {
      next(error);
    }
  }

  async createVariant(req, res, next) {
    try {
      const { productId } = req.params;
      const product = await Product.findById(productId);
      if (!product) return next(httpError(404, 'NOT_FOUND', 'Không tìm thấy sản phẩm'));

      let variantData = req.body;
      if (req.body.variant && typeof req.body.variant === 'string') {
        variantData = JSON.parse(req.body.variant);
      }

      let imageUrls = [];
      if (req.files && req.files.length > 0) {
        imageUrls = req.files.map(file => ({
          imageUrl: `/${(file.path || file.filename).replace(/\\/g, '/')}`
        }));
      }

      const variant = new ProductVariant({
        productId,
        sku: variantData.sku || '',
        colorName: variantData.colorName || '',
        frameFinish: variantData.frameFinish || '',
        lensWidthMm: Number(variantData.lensWidthMm) || 0,
        bridgeWidthMm: Number(variantData.bridgeWidthMm) || 0,
        templeLengthMm: Number(variantData.templeLengthMm) || 0,
        sizeLabel: variantData.sizeLabel || '',
        price: Number(variantData.price) || 0,
        discountPrice: variantData.discountPrice ? Number(variantData.discountPrice) : undefined,
        quantity: Number(variantData.quantity) || 0,
        status: variantData.status || 'ACTIVE',
        orderItemType: variantData.orderItemType || 'IN_STOCK',
        imageUrl: imageUrls
      });

      await variant.save();
      return res.status(201).json({ success: true, result: variant });
    } catch (error) {
      next(error);
    }
  }

  async updateVariant(req, res, next) {
    try {
      const { variantId } = req.params;
      let updateData = req.body;

      if (req.body.variant && typeof req.body.variant === 'string') {
        updateData = JSON.parse(req.body.variant);
      }

      let imageUrls = [];
      if (updateData.imageUrl && Array.isArray(updateData.imageUrl)) {
        imageUrls = updateData.imageUrl.map(img => (typeof img === 'string' ? { imageUrl: img } : img));
      }

      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => ({
          imageUrl: `/${(file.path || file.filename).replace(/\\/g, '/')}`
        }));
        imageUrls = [...imageUrls, ...newImages];
      }

      const variant = await ProductVariant.findByIdAndUpdate(
        variantId,
        {
          sku: updateData.sku,
          colorName: updateData.colorName,
          frameFinish: updateData.frameFinish,
          lensWidthMm: updateData.lensWidthMm !== undefined ? Number(updateData.lensWidthMm) : undefined,
          bridgeWidthMm: updateData.bridgeWidthMm !== undefined ? Number(updateData.bridgeWidthMm) : undefined,
          templeLengthMm: updateData.templeLengthMm !== undefined ? Number(updateData.templeLengthMm) : undefined,
          sizeLabel: updateData.sizeLabel,
          price: updateData.price !== undefined ? Number(updateData.price) : undefined,
          discountPrice: updateData.discountPrice !== undefined ? Number(updateData.discountPrice) : undefined,
          quantity: updateData.quantity !== undefined ? Number(updateData.quantity) : undefined,
          status: updateData.status,
          orderItemType: updateData.orderItemType,
          imageUrl: imageUrls
        },
        { new: true, runValidators: true }
      );

      if (!variant) return next(httpError(404, 'NOT_FOUND', 'Không tìm thấy biến thể'));
      return res.status(200).json({ success: true, result: variant });
    } catch (error) {
      next(error);
    }
  }

  async deleteVariant(req, res, next) {
    try {
      const { variantId } = req.params;
      const variant = await ProductVariant.findByIdAndDelete(variantId);
      if (!variant) return next(httpError(404, 'NOT_FOUND', 'Không tìm thấy biến thể'));
      return res.status(200).json({ success: true, message: 'Xóa thành công' });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductVariantController();
