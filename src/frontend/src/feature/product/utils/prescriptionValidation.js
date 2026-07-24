/**
 * Thư viện helper hỗ trợ định dạng (format) và kiểm tra tính hợp lệ (validate)
 * cho thông tin đơn kính thuốc.
 */

// Định dạng giá trị quang học sau khi người dùng nhập xong (onBlur)
export const formatOpticalValue = (field, value) => {
  if (value === '' || value === undefined || value === null) return '';
  
  // Loại bỏ khoảng trắng thừa
  const cleanVal = String(value).trim();
  if (cleanVal === '') return '';

  const valNum = parseFloat(cleanVal);
  if (isNaN(valNum)) return '';

  let rounded = valNum;

  if (field === 'sphere' || field === 'cylinder' || field === 'add') {
    // Làm tròn đến 0.25 gần nhất
    rounded = Math.round(valNum * 4) / 4;
    
    // Giới hạn miền giá trị
    if (field === 'sphere') rounded = Math.max(-20.0, Math.min(20.0, rounded));
    if (field === 'cylinder') rounded = Math.max(-6.0, Math.min(6.0, rounded));
    if (field === 'add') rounded = Math.max(0.75, Math.min(4.0, rounded));

    // Trả về chuỗi kèm dấu + hoặc -
    if (rounded > 0) return `+${rounded.toFixed(2)}`;
    if (rounded < 0) return `${rounded.toFixed(2)}`;
    return '0.00';
  }

  if (field === 'axis') {
    // Làm tròn thành số nguyên
    rounded = Math.round(valNum);
    rounded = Math.max(1, Math.min(180, rounded));
    return rounded.toString();
  }

  if (field === 'pd') {
    // Làm tròn đến 0.5 gần nhất
    rounded = Math.round(valNum * 2) / 2;
    rounded = Math.max(20.0, Math.min(40.0, rounded));
    return rounded.toFixed(1);
  }

  return cleanVal;
};

// Kiểm tra toàn bộ đơn kính thuốc
export const validatePrescription = (prescription, activeTab) => {
  const errors = { od: {}, os: {}, general: '' };
  let isValid = true;

  if (activeTab === 'image') {
    if (!prescription.imageUrl) {
      errors.general = 'Vui lòng tải lên ảnh đơn kính thuốc của bác sĩ.';
      isValid = false;
    }
    return { isValid, errors };
  }

  // Nhập thủ công
  const od = prescription.od || {};
  const os = prescription.os || {};

  const hasValue = (val) => val !== '' && val !== null && val !== undefined && String(val).trim() !== '';

  const checkEye = (eyeName, eyeData, errObj) => {
    const sph = eyeData.sphere;
    const cyl = eyeData.cylinder;
    const ax = eyeData.axis;
    const add = eyeData.add;
    const pd = eyeData.pd;

    // Ràng buộc 1: Nếu có độ loạn (CYL) khác 0, bắt buộc phải có trục loạn (AX)
    if (hasValue(cyl)) {
      const cylVal = parseFloat(cyl);
      if (!isNaN(cylVal) && cylVal !== 0) {
        if (!hasValue(ax) || parseInt(ax, 10) === 0) {
          errObj.axis = 'Bắt buộc nhập trục AX (1-180) khi có độ loạn CYL';
          isValid = false;
        }
      }
    }

    // Ràng buộc 2: Nếu có trục loạn (AX), bắt buộc phải có độ loạn (CYL)
    if (hasValue(ax)) {
      const axVal = parseInt(ax, 10);
      if (!isNaN(axVal) && axVal > 0) {
        if (!hasValue(cyl) || parseFloat(cyl) === 0) {
          errObj.cylinder = 'Bắt buộc nhập độ loạn CYL khi có trục AX';
          isValid = false;
        }
      }
    }

    // Kiểm tra miền giá trị của từng ô (chỉ khi có nhập giá trị)
    if (hasValue(sph)) {
      const val = parseFloat(sph);
      if (isNaN(val) || val < -20.0 || val > 20.0) {
        errObj.sphere = 'SPH phải từ -20.00 đến +20.00';
        isValid = false;
      }
    }

    if (hasValue(cyl)) {
      const val = parseFloat(cyl);
      if (isNaN(val) || val < -6.0 || val > 6.0) {
        errObj.cylinder = 'CYL phải từ -6.00 đến +6.00';
        isValid = false;
      }
    }

    if (hasValue(ax)) {
      const val = parseFloat(ax);
      if (isNaN(val) || val < 1 || val > 180 || !Number.isInteger(val)) {
        errObj.axis = 'AX phải là số nguyên từ 1 đến 180';
        isValid = false;
      }
    }

    if (hasValue(add)) {
      const val = parseFloat(add);
      if (isNaN(val) || val < 0.75 || val > 4.0) {
        errObj.add = 'ADD phải từ 0.75 đến 4.00';
        isValid = false;
      }
    }

    if (hasValue(pd)) {
      const val = parseFloat(pd);
      if (isNaN(val) || val < 20.0 || val > 40.0) {
        errObj.pd = 'PD từng mắt phải từ 20.0 đến 40.0';
        isValid = false;
      }
    }
  };

  checkEye('od', od, errors.od);
  checkEye('os', os, errors.os);

  // Ràng buộc 3: Phải nhập thông tin của ít nhất một mắt (OD hoặc OS)
  const hasOdData = Object.values(od).some(hasValue);
  const hasOsData = Object.values(os).some(hasValue);

  if (!hasOdData && !hasOsData) {
    errors.general = 'Vui lòng điền thông số độ của ít nhất một mắt hoặc tải ảnh đơn kính.';
    isValid = false;
  }

  return { isValid, errors };
};
