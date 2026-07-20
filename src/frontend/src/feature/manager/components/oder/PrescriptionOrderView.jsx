import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Glasses,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ImageIcon,
  AlertTriangle,
  User,
  Phone,
  MapPin,
  Sparkles,
  Wrench,
  Eye,
  Info,
} from 'lucide-react';

const formatCurrency = (val) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

// ─── SUB-COMPONENT: BẢNG THÔNG SỐ ĐỘ MẮT (OD VS OS) ───────────
function EyeSpecsMatrix({ prescription }) {
  const [showImageModal, setShowImageModal] = useState(false);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Thông Số Kỹ Thuật Kính Thuốc</span>
        </div>
        {prescription.imageUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImageModal(true)}
            className="h-8 text-xs font-semibold text-blue-600 border-blue-200 bg-blue-50/50 hover:bg-blue-100 gap-1.5 rounded-lg"
          >
            <ImageIcon className="w-3.5 h-3.5" /> Xem Ảnh Đơn Thuốc Gốc
          </Button>
        )}
      </div>

      {/* Bảng thông số Mắt Phải (OD) & Mắt Trái (OS) */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-200/70 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
              <th className="p-2.5 rounded-l-lg">Mắt (Eye)</th>
              <th className="p-2.5 text-center">Cầu (SPH)</th>
              <th className="p-2.5 text-center">Trụ (CYL)</th>
              <th className="p-2.5 text-center">Trục (AXIS)</th>
              <th className="p-2.5 text-center">Độ Cộng (ADD)</th>
              <th className="p-2.5 text-center rounded-r-lg">Khoảng Cách Đồng Tử (PD)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
            {/* OD - Mắt Phải */}
            <tr className="hover:bg-blue-50/40 transition-colors">
              <td className="p-2.5 font-bold text-blue-700 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> OD (Mắt Phải)
              </td>
              <td className="p-2.5 text-center font-bold">
                {prescription.odSphere > 0 ? `+${prescription.odSphere}` : prescription.odSphere}
              </td>
              <td className="p-2.5 text-center font-bold">{prescription.odCylinder}</td>
              <td className="p-2.5 text-center">{prescription.odAxis}°</td>
              <td className="p-2.5 text-center">{prescription.odAdd ?? 0}</td>
              <td className="p-2.5 text-center font-bold text-slate-900">{prescription.odPd ?? 0} mm</td>
            </tr>
            {/* OS - Mắt Trái */}
            <tr className="hover:bg-indigo-50/40 transition-colors">
              <td className="p-2.5 font-bold text-indigo-700 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> OS (Mắt Trái)
              </td>
              <td className="p-2.5 text-center font-bold">
                {prescription.osSphere > 0 ? `+${prescription.osSphere}` : prescription.osSphere}
              </td>
              <td className="p-2.5 text-center font-bold">{prescription.osCylinder}</td>
              <td className="p-2.5 text-center">{prescription.osAxis}°</td>
              <td className="p-2.5 text-center">{prescription.osAdd ?? 0}</td>
              <td className="p-2.5 text-center font-bold text-slate-900">{prescription.osPd ?? 0} mm</td>
            </tr>
          </tbody>
        </table>
      </div>

      {prescription.note && (
        <div className="bg-amber-50/80 border border-amber-200 text-amber-900 text-xs p-3 rounded-xl flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Ghi chú từ khách hàng:</span> {prescription.note}
          </div>
        </div>
      )}

      {/* Modal Ảnh Đơn Thuốc */}
      {showImageModal && prescription.imageUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-4 space-y-3 shadow-2xl relative">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" /> Ảnh Đơn Kính Thuốc Gốc Khách Tải Lên
              </h3>
              <button onClick={() => setShowImageModal(false)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex justify-center bg-slate-100 rounded-xl p-2 border">
              <img
                src={
                  prescription.imageUrl.startsWith('http') || prescription.imageUrl.startsWith('data:')
                    ? prescription.imageUrl
                    : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${prescription.imageUrl.startsWith('/') ? '' : '/'}${prescription.imageUrl}`
                }
                alt="Prescription Scan"
                className="max-w-full h-auto object-contain rounded-lg"
              />
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setShowImageModal(false)} className="rounded-xl">Đóng lại</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function PrescriptionOrderView({
  orderId,
  orderStatus,
  customerName,
  customerPhone,
  deliveryAddress,
  totalAmount,
  paidAmount,
  items,
  onVerifyOrder,
}) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AWAITING_VERIFICATION':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold px-3 py-1 text-xs gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" /> CHỜ NHÂN VIÊN XÁC MINH (AWAITING_VERIFICATION)
          </Badge>
        );
      case 'PROCESSING':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-bold px-3 py-1 text-xs gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-blue-600 animate-spin" /> ĐANG GIA CÔNG / SẢN XUẤT (IN PRODUCTION)
          </Badge>
        );
      case 'PRODUCED':
        return (
          <Badge className="bg-teal-100 text-teal-800 border-teal-300 font-bold px-3 py-1 text-xs gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> ĐÃ GIA CÔNG XONG (PRODUCED)
          </Badge>
        );
      case 'ON_HOLD':
        return (
          <Badge className="bg-slate-200 text-slate-700 border-slate-300 font-bold px-3 py-1 text-xs gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-500" /> TẠM GIỮ / TỪ CHỐI (ON_HOLD)
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="max-w-4xl mx-auto shadow-xl border-slate-200 rounded-3xl overflow-hidden bg-white">
      {/* Header Bar */}
      <CardHeader className="bg-slate-900 text-white p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Glasses className="w-6 h-6 text-blue-400" />
              <CardTitle className="text-xl font-black tracking-tight">
                Đơn Hàng Kính Thuốc #{orderId}
              </CardTitle>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Loại đơn: <span className="text-blue-300 font-bold">Gia công cắt tròng theo đơn kính thuốc (PRESCRIPTION)</span>
            </p>
          </div>
          <div>{getStatusBadge(orderStatus)}</div>
        </div>

        {orderStatus === 'AWAITING_VERIFICATION' && (
          <div className="bg-amber-500/20 border border-amber-400/40 rounded-xl p-3 text-amber-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Đơn hàng đã thanh toán. Vui lòng kiểm tra kỹ <strong>thông số mắt (OD/OS)</strong> trước khi phê duyệt chuyển sang gia công sản xuất.
              </span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Khách hàng & Tài chính */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 border rounded-2xl p-4 space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" /> Khách Hàng
            </div>
            <p className="font-bold text-slate-900 text-sm">{customerName}</p>
            <p className="text-xs text-slate-600 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> {customerPhone}
            </p>
            <p className="text-xs text-slate-600 flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" /> {deliveryAddress}
            </p>
          </div>

          <div className="bg-slate-50 border rounded-2xl p-4 space-y-2 flex flex-col justify-between">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tình Trạng Thanh Toán
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Tổng tiền đơn:</span>
                <span className="font-bold text-slate-900">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-emerald-700 font-medium">Đã thanh toán:</span>
                <span className="font-bold text-emerald-700">-{formatCurrency(paidAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Danh sách sản phẩm & Thông số kính thuốc */}
        <div className="space-y-4">
          <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
            <Glasses className="w-4 h-4 text-blue-600" /> Danh Mục Kính Thuốc & Tròng Kính Gia Công
          </h4>

          {items?.map((item) => (
            <div key={item.orderItemId} className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-white shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border flex items-center justify-center shrink-0">
                    <Glasses className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-base">{item.productName}</h5>
                    {item.lensName && (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold mt-1">
                        Tròng kính: {item.lensName}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900 text-base">{formatCurrency(item.totalPrice)}</p>
                  <p className="text-xs text-slate-500 font-medium">Số lượng: {item.quantity}</p>
                </div>
              </div>

              {/* Hiển thị bảng OD/OS + Ảnh đơn thuốc */}
              {item.prescription && <EyeSpecsMatrix prescription={item.prescription} />}
            </div>
          ))}
        </div>

        {/* Thanh Xác Minh Của Nhân Viên */}
        {orderStatus === 'AWAITING_VERIFICATION' && onVerifyOrder && (
          <div className="bg-blue-50/70 border-2 border-blue-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <span>Xác Minh Đơn Hàng (Staff Verification)</span>
            </div>

            {showRejectForm ? (
              <div className="space-y-3 bg-white p-4 rounded-xl border border-red-200">
                <label className="text-xs font-bold text-red-700 block">Lý do từ chối / tạm giữ đơn:</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ví dụ: Đơn thuốc mờ, thiếu thông số độ trụ (CYL)..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-400"
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowRejectForm(false)}>Hủy</Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      onVerifyOrder(false, rejectReason);
                      setShowRejectForm(false);
                    }}
                  >
                    Xác nhận Tạm Giữ (Reject)
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  onClick={() => onVerifyOrder(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6 h-11 gap-2 shadow-md"
                >
                  <CheckCircle2 className="w-5 h-5" /> Phê Duyệt & Chuyển Sang Gia Công Sản Xuất (IN_PRODUCTION)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectForm(true)}
                  className="border-red-300 text-red-600 hover:bg-red-50 font-bold rounded-xl px-5 h-11 gap-2"
                >
                  <XCircle className="w-5 h-5" /> Từ Chối / Tạm Giữ (ON_HOLD)
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
