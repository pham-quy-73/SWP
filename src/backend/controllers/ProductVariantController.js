import XLSX from 'xlsx';
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

  /**
   * Import nhiều biến thể từ file Excel (.xlsx / .xls)
   */
  async importVariantsFromExcel(req, res, next) {
    try {
      const { productId } = req.params;
      const product = await Product.findById(productId);
      if (!product) return next(httpError(404, 'NOT_FOUND', 'Không tìm thấy sản phẩm'));

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Vui lòng tải lên file Excel (.xlsx hoặc .xls)' });
      }

      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const rawRows = XLSX.utils.sheet_to_json(sheet);
      if (!rawRows || rawRows.length === 0) {
        return res.status(400).json({ success: false, message: 'File Excel rỗng hoặc không có dữ liệu hợp lệ' });
      }

      let createdCount = 0;
      let updatedCount = 0;
      const processedVariants = [];

      for (let index = 0; index < rawRows.length; index++) {
        const row = rawRows[index];
        const rowNum = index + 2;
        const colorName = (row['Màu sắc'] || row['colorName'] || row['Color'] || '').toString().trim();
        const sku = (row['Mã SKU'] || row['sku'] || row['SKU'] || '').toString().trim();
        const frameFinish = (row['Hoàn thiện gọng'] || row['frameFinish'] || '').toString().trim();
        const sizeLabel = (row['Kích thước nhãn'] || row['sizeLabel'] || row['Size'] || 'M').toString().trim();
        const lensWidthMm = Number(row['Chiều rộng tròng (mm)'] || row['lensWidthMm'] || 0) || 0;
        const bridgeWidthMm = Number(row['Chiều rộng cầu (mm)'] || row['bridgeWidthMm'] || 0) || 0;
        const templeLengthMm = Number(row['Chiều dài càng (mm)'] || row['templeLengthMm'] || 0) || 0;
        const price = Number(row['Giá bán'] || row['price'] || 0);
        const discountPrice = (row['Giá giảm'] || row['discountPrice']) ? Number(row['Giá giảm'] || row['discountPrice']) : undefined;
        const quantity = Number(row['Số lượng tồn kho'] || row['quantity'] || 0);
        const orderItemType = (row['Loại kho'] || row['orderItemType'] || 'IN_STOCK').toString().toUpperCase() === 'PRE_ORDER' ? 'PRE_ORDER' : 'IN_STOCK';
        const status = (row['Trạng thái'] || row['status'] || 'ACTIVE').toString().toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

        if (!colorName) {
          errors.push(`Dòng ${rowNum}: Thiếu tên màu sắc`);
          continue;
        }

        if (!price || isNaN(price) || price <= 0) {
          errors.push(`Dòng ${rowNum}: Giá bán không hợp lệ`);
          continue;
        }

        const generatedSku = sku || `SKU-${colorName.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // Tự động kiểm tra trùng lặp theo productId + (sku hoặc colorName)
        const filterOr = [];
        if (sku) filterOr.push({ sku });
        if (colorName) filterOr.push({ colorName });

        let existing = await ProductVariant.findOne({
          productId,
          $or: filterOr
        });

        if (existing) {
          // CẬP NHẬT BIẾN THỂ ĐÃ TỒN TẠI
          existing.colorName = colorName;
          if (sku) existing.sku = sku;
          existing.frameFinish = frameFinish || existing.frameFinish;
          existing.sizeLabel = sizeLabel || existing.sizeLabel;
          existing.lensWidthMm = lensWidthMm || existing.lensWidthMm;
          existing.bridgeWidthMm = bridgeWidthMm || existing.bridgeWidthMm;
          existing.templeLengthMm = templeLengthMm || existing.templeLengthMm;
          existing.price = price;
          if (discountPrice !== undefined) existing.discountPrice = discountPrice;
          existing.quantity = quantity;
          existing.status = status;
          existing.orderItemType = orderItemType;

          await existing.save();
          updatedCount++;
          processedVariants.push(existing);
        } else {
          // TẠO MỚI BIẾN THỂ NẾU CHƯA TỒN TẠI
          const newVariant = new ProductVariant({
            productId,
            sku: generatedSku,
            colorName,
            frameFinish,
            sizeLabel,
            lensWidthMm,
            bridgeWidthMm,
            templeLengthMm,
            price,
            discountPrice,
            quantity,
            status,
            orderItemType,
            imageUrl: []
          });

          await newVariant.save();
          createdCount++;
          processedVariants.push(newVariant);
        }
      }

      if (processedVariants.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Không có dòng dữ liệu hợp lệ nào được xử lý',
          errors
        });
      }

      let message = `Đã xử lý ${processedVariants.length} phiên bản`;
      if (updatedCount > 0 && createdCount > 0) {
        message = `Đã cập nhật ${updatedCount} phiên bản có sẵn và thêm mới ${createdCount} phiên bản mới`;
      } else if (updatedCount > 0) {
        message = `Đã cập nhật dữ liệu cho ${updatedCount} phiên bản hiện có`;
      } else {
        message = `Đã thêm mới ${createdCount} phiên bản`;
      }

      return res.status(200).json({
        success: true,
        message,
        result: processedVariants,
        createdCount,
        updatedCount,
        errors
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductVariantController();
