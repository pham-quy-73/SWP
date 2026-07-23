import Lens from '../models/Lens.js';

/**
 * Validate payload tròng kính từ client (dùng chung create/update).
 * @param {Object} body - req.body
 * @param {boolean} isCreate - create yêu cầu đủ trường bắt buộc; update cho phép thiếu
 * @returns {{ ok: true, data: Object } | { ok: false, message: string }}
 */
const validateLensPayload = (body, isCreate) => {
  const { name, material, price, discountPrice, description, status } = body;

  if (isCreate && (!name || !material || price === undefined)) {
    return { ok: false, message: 'Tên tròng kính, chất liệu và giá là bắt buộc' };
  }

  const data = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 200) {
      return { ok: false, message: 'Tên tròng kính phải là chuỗi 1-200 ký tự' };
    }
    data.name = name.trim();
  }
  if (material !== undefined) {
    if (typeof material !== 'string' || !material.trim() || material.trim().length > 200) {
      return { ok: false, message: 'Chất liệu phải là chuỗi 1-200 ký tự' };
    }
    data.material = material.trim();
  }
  if (price !== undefined) {
    const p = Number(price);
    if (!Number.isFinite(p) || p < 0) {
      return { ok: false, message: 'Giá tròng kính phải là số không âm' };
    }
    data.price = p;
  }
  if (discountPrice !== undefined && discountPrice !== null && discountPrice !== '') {
    const dp = Number(discountPrice);
    if (!Number.isFinite(dp) || dp < 0) {
      return { ok: false, message: 'Giá khuyến mãi phải là số không âm' };
    }
    data.discountPrice = dp;
  }
  if (description !== undefined) {
    if (typeof description !== 'string' || description.length > 2000) {
      return { ok: false, message: 'Mô tả phải là chuỗi tối đa 2000 ký tự' };
    }
    data.description = description.trim();
  }
  if (status !== undefined) {
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return { ok: false, message: 'Trạng thái chỉ nhận ACTIVE hoặc INACTIVE' };
    }
    data.status = status;
  }

  return { ok: true, data };
};

/**
 * Lấy danh sách tròng kính
 * Query params: ?search= &status=ACTIVE|INACTIVE|ALL
 */
export const getLenses = async (req, res, next) => {
  try {
    const { search, status = 'ACTIVE' } = req.query;

    const query = {};

    if (status !== 'ALL') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { material: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const lenses = await Lens.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: lenses.length,
      data: lenses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy chi tiết 1 tròng kính theo ID
 */
export const getLensById = async (req, res, next) => {
  try {
    const lens = await Lens.findById(req.params.id);
    if (!lens) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tròng kính'
      });
    }

    res.status(200).json({
      success: true,
      data: lens
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tạo mới tròng kính
 */
export const createLens = async (req, res, next) => {
  try {
    const checked = validateLensPayload(req.body, true);
    if (!checked.ok) {
      return res.status(400).json({ success: false, message: checked.message });
    }

    const lens = await Lens.create({
      description: '',
      status: 'ACTIVE',
      ...checked.data
    });

    res.status(201).json({
      success: true,
      message: 'Tạo tròng kính thành công',
      data: lens
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật tròng kính
 */
export const updateLens = async (req, res, next) => {
  try {
    const checked = validateLensPayload(req.body, false);
    if (!checked.ok) {
      return res.status(400).json({ success: false, message: checked.message });
    }
    if (Object.keys(checked.data).length === 0) {
      return res.status(400).json({ success: false, message: 'Không có trường hợp lệ nào để cập nhật' });
    }

    // Chỉ set các trường client thực sự gửi — tránh ghi đè undefined lên dữ liệu cũ.
    const lens = await Lens.findByIdAndUpdate(
      req.params.id,
      { $set: checked.data },
      { new: true, runValidators: true }
    );

    if (!lens) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tròng kính'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật tròng kính thành công',
      data: lens
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Xóa tròng kính (Chuyển trạng thái sang INACTIVE)
 */
export const deleteLens = async (req, res, next) => {
  try {
    const lens = await Lens.findByIdAndUpdate(
      req.params.id,
      { status: 'INACTIVE' },
      { new: true }
    );

    if (!lens) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tròng kính'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa tròng kính thành công (đã chuyển sang INACTIVE)',
      data: lens
    });
  } catch (error) {
    next(error);
  }
};
