import Address from '../models/Address.js';

const validateAddressInputs = (recipientName, phoneNumber, deliveryAddress) => {
  if (recipientName !== undefined) {
    const name = String(recipientName).trim();
    if (!name) {
      throw new Error('Họ tên người nhận không được để trống.');
    }
    if (name.length > 100) {
      throw new Error('Họ tên người nhận không được dài quá 100 ký tự.');
    }
  }

  if (phoneNumber !== undefined) {
    const phone = String(phoneNumber).trim().replace(/[\s.-]/g, '');
    if (!phone) {
      throw new Error('Số điện thoại không được để trống.');
    }
    if (!/^(\+84|0)\d{8,10}$/.test(phone)) {
      throw new Error('Số điện thoại không hợp lệ (phải bắt đầu bằng 0 hoặc +84, gồm 9-11 chữ số).');
    }
  }

  if (deliveryAddress !== undefined) {
    const addr = String(deliveryAddress).trim();
    if (!addr) {
      throw new Error('Địa chỉ giao hàng không được để trống.');
    }
    if (addr.length < 3) {
      throw new Error('Địa chỉ giao hàng phải dài ít nhất 3 ký tự.');
    }
    if (addr.length > 300) {
      throw new Error('Địa chỉ giao hàng không được dài quá 300 ký tự.');
    }
  }
};

class AddressController {
  /**
   * Lấy danh sách địa chỉ đã lưu của người dùng hiện tại
   * Sắp xếp: mặc định trước, mới cập nhật trước
   */
  async listMyAddresses(req, res, next) {
    try {
      const addresses = await Address.find({ user_id: req.user._id })
        .sort({ is_default: -1, updatedAt: -1 });
      return res.status(200).json({ code: 0, result: addresses });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Tạo địa chỉ mới cho người dùng hiện tại
   * Nếu is_default = true (hoặc là địa chỉ đầu tiên), bỏ cờ mặc định ở các bản ghi cũ.
   */
  async createAddress(req, res, next) {
    try {
      const { label, recipientName, phoneNumber, deliveryAddress, isDefault } = req.body;

      try {
        validateAddressInputs(recipientName, phoneNumber, deliveryAddress);
      } catch (err) {
        return res.status(400).json({
          error_code: 'VALIDATION_ERROR',
          message: err.message
        });
      }

      const existingCount = await Address.countDocuments({ user_id: req.user._id });
      const shouldBeDefault = Boolean(isDefault) || existingCount === 0;

      if (shouldBeDefault) {
        await Address.updateMany(
          { user_id: req.user._id, is_default: true },
          { $set: { is_default: false } }
        );
      }

      const address = await Address.create({
        user_id: req.user._id,
        label: label || '',
        recipient_name: recipientName,
        phone_number: phoneNumber,
        delivery_address: deliveryAddress,
        is_default: shouldBeDefault
      });

      return res.status(201).json({
        code: 0,
        message: 'Đã lưu địa chỉ giao hàng',
        result: address
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cập nhật địa chỉ đã lưu (chỉ chủ sở hữu mới được sửa)
   */
  async updateAddress(req, res, next) {
    try {
      const { id } = req.params;
      const address = await Address.findById(id);

      if (!address) {
        return res.status(404).json({ error_code: 'ADDRESS_NOT_FOUND', message: 'Không tìm thấy địa chỉ' });
      }
      if (address.user_id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error_code: 'FORBIDDEN', message: 'Bạn không có quyền chỉnh sửa địa chỉ này' });
      }

      const { label, recipientName, phoneNumber, deliveryAddress, isDefault } = req.body;

      try {
        validateAddressInputs(recipientName, phoneNumber, deliveryAddress);
      } catch (err) {
        return res.status(400).json({
          error_code: 'VALIDATION_ERROR',
          message: err.message
        });
      }

      if (label !== undefined) address.label = label;
      if (recipientName !== undefined) address.recipient_name = recipientName;
      if (phoneNumber !== undefined) address.phone_number = phoneNumber;
      if (deliveryAddress !== undefined) address.delivery_address = deliveryAddress;

      if (isDefault === true && !address.is_default) {
        await Address.updateMany(
          { user_id: req.user._id, is_default: true },
          { $set: { is_default: false } }
        );
        address.is_default = true;
      }

      await address.save();
      return res.status(200).json({ code: 0, message: 'Cập nhật địa chỉ thành công', result: address });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Đặt một địa chỉ làm mặc định (bỏ cờ ở các bản ghi cùng chủ)
   */
  async setDefault(req, res, next) {
    try {
      const { id } = req.params;
      const address = await Address.findById(id);

      if (!address) {
        return res.status(404).json({ error_code: 'ADDRESS_NOT_FOUND', message: 'Không tìm thấy địa chỉ' });
      }
      if (address.user_id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error_code: 'FORBIDDEN', message: 'Bạn không có quyền thao tác trên địa chỉ này' });
      }

      await Address.updateMany(
        { user_id: req.user._id, is_default: true },
        { $set: { is_default: false } }
      );
      address.is_default = true;
      await address.save();

      return res.status(200).json({ code: 0, message: 'Đã đặt làm địa chỉ mặc định', result: address });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xóa địa chỉ đã lưu. Nếu xóa địa chỉ mặc định, tự động chọn địa chỉ mới nhất làm mặc định.
   */
  async deleteAddress(req, res, next) {
    try {
      const { id } = req.params;
      const address = await Address.findById(id);

      if (!address) {
        return res.status(404).json({ error_code: 'ADDRESS_NOT_FOUND', message: 'Không tìm thấy địa chỉ' });
      }
      if (address.user_id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error_code: 'FORBIDDEN', message: 'Bạn không có quyền xóa địa chỉ này' });
      }

      const wasDefault = address.is_default;
      await Address.findByIdAndDelete(id);

      if (wasDefault) {
        const fallback = await Address.findOne({ user_id: req.user._id }).sort({ updatedAt: -1 });
        if (fallback) {
          fallback.is_default = true;
          await fallback.save();
        }
      }

      return res.status(200).json({ code: 0, message: 'Đã xóa địa chỉ' });
    } catch (error) {
      next(error);
    }
  }
}

export default new AddressController();
