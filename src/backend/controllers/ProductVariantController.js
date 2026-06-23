import ProductVariant from '../models/ProductVariant.js';
import Product from '../models/Product.js';

class ProductVariantController {
  // GET /api/products/:productId/variants
  async getVariants(req, res) {
    try {
      const { productId } = req.params;
      const variants = await ProductVariant.find({ productId });
      
      return res.status(200).json({
        success: true,
        result: variants
      });
    } catch (error) {
      console.error('Error fetching variants:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi máy chủ khi lấy dữ liệu biến thể'
      });
    }
  }

  // POST /api/products/:productId/variants
  async createVariant(req, res) {
    try {
      const { productId } = req.params;

      // Kiểm tra sản phẩm có tồn tại không
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy sản phẩm'
        });
      }

      const variant = new ProductVariant({
        productId,
        colorName: req.body.colorName || '',
        frameFinish: req.body.frameFinish || '',
        lensWidthMm: Number(req.body.lensWidthMm) || 0,
        bridgeWidthMm: Number(req.body.bridgeWidthMm) || 0,
        templeLengthMm: Number(req.body.templeLengthMm) || 0,
        sizeLabel: req.body.sizeLabel || '',
        price: Number(req.body.price) || 0,
        quantity: Number(req.body.quantity) || 0,
        status: req.body.status || 'ACTIVE',
        orderItemType: req.body.orderItemType || 'IN_STOCK'
      });

      await variant.save();

      return res.status(201).json({
        success: true,
        result: variant
      });
    } catch (error) {
      console.error('Error creating variant:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi máy chủ khi thêm biến thể'
      });
    }
  }

  // PUT /api/products/:productId/variants/:variantId
  async updateVariant(req, res) {
    try {
      const { variantId } = req.params;

      const variant = await ProductVariant.findByIdAndUpdate(
        variantId,
        {
          colorName: req.body.colorName,
          frameFinish: req.body.frameFinish,
          lensWidthMm: req.body.lensWidthMm !== undefined ? Number(req.body.lensWidthMm) : undefined,
          bridgeWidthMm: req.body.bridgeWidthMm !== undefined ? Number(req.body.bridgeWidthMm) : undefined,
          templeLengthMm: req.body.templeLengthMm !== undefined ? Number(req.body.templeLengthMm) : undefined,
          sizeLabel: req.body.sizeLabel,
          price: req.body.price !== undefined ? Number(req.body.price) : undefined,
          quantity: req.body.quantity !== undefined ? Number(req.body.quantity) : undefined,
          status: req.body.status,
          orderItemType: req.body.orderItemType
        },
        { new: true, runValidators: true }
      );

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy biến thể để cập nhật'
        });
      }

      return res.status(200).json({
        success: true,
        result: variant
      });
    } catch (error) {
      console.error('Error updating variant:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi máy chủ khi cập nhật biến thể'
      });
    }
  }

  // DELETE /api/products/:productId/variants/:variantId
  async deleteVariant(req, res) {
    try {
      const { variantId } = req.params;

      const variant = await ProductVariant.findByIdAndDelete(variantId);
      if (!variant) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy biến thể để xóa'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Mã biến thể đã xóa thành công'
      });
    } catch (error) {
      console.error('Error deleting variant:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi máy chủ khi xóa biến thể'
      });
    }
  }
}

export default new ProductVariantController();
