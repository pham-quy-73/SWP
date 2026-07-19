import { useState } from 'react';
import { ChevronDown, Eye, FileText, Minus, Plus, Trash2 } from 'lucide-react';

export const CartItemRow = ({ item, updateQuantity, removeFromCart }) => {
  const [showRx, setShowRx] = useState(false);

  const hasImage = !!item.prescription?.imageUrl;

  const hasManualInput = !!(
    item.prescription?.od?.sphere ||
    item.prescription?.od?.cylinder ||
    item.prescription?.od?.axis ||
    item.prescription?.od?.add ||
    item.prescription?.os?.sphere ||
    item.prescription?.os?.cylinder ||
    item.prescription?.os?.axis ||
    item.prescription?.os?.add
  );

  // Hiển thị khối đơn kính khi item thực sự có dữ liệu prescription
  // (hiện FE chưa có form nhập nên luôn ẩn; sẵn sàng cho feature nhập đơn kính sau này)
  const hasPrescription = hasImage || hasManualInput;

  // NÂNG CẤP: Tính tổng giá trị của riêng dòng này (Gọng + Tròng) nhân với số lượng
  const basePrice = item.price || 0;
  const lensPrice = item.lensPrice || 0;
  const rowTotal = (basePrice + lensPrice) * item.quantity;

  return (
    <div
      className={`flex flex-col bg-white border rounded-2xl overflow-hidden transition-all duration-300 group/item ${showRx
          ? 'border-zinc-300 shadow-md'
          : 'border-zinc-200 shadow-sm hover:border-zinc-300 hover:shadow-md'
        }`}
    >
      {/* PHẦN TRÊN: THÔNG TIN CƠ BẢN SẢN PHẨM */}
      <div className="p-3.5 flex gap-4 bg-white relative z-10">
        <div className="w-24 h-24 bg-zinc-50/80 rounded-xl border border-zinc-100 shrink-0 relative flex items-center justify-center p-2">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-contain mix-blend-multiply group-hover/item:scale-105 transition-transform duration-500"
          />
          {item.orderType === 'pre-order' && (
            <span className="absolute -top-1.5 -left-1.5 bg-orange-500 text-[8px] text-white px-2 py-0.5 rounded-sm font-black uppercase tracking-widest shadow-sm z-10 rotate-[-4deg]">
              Đặt trước
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between py-0.5">
          <div className="space-y-2">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <h3 className="font-black text-zinc-900 text-[15px] leading-tight line-clamp-2 pr-2">
                  {item.name}
                </h3>

                {/* NÂNG CẤP: Hiển thị chi tiết Tròng Kính mua kèm */}
                {item.lensId && (
                  <div className="mt-1.5 flex flex-col gap-0.5">
                    <p className="text-[12px] text-zinc-500 font-medium leading-snug flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                      {item.lensName}
                    </p>
                    <p className="text-[11px] font-bold text-emerald-600 pl-2.5">
                      Giá: {lensPrice.toLocaleString('vi-VN')}₫
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeFromCart(item.id)}
                className="text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all p-1.5 rounded-md shrink-0 -mt-1 -mr-1"
                title="Xoá sản phẩm"
              >
                <Trash2 className="w-[16px] h-[16px]" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {item.lensId && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 h-6 rounded border border-orange-200/60">
                  Kèm Tròng
                </span>
              )}
              {hasPrescription && (
                <button
                  type="button"
                  onClick={() => setShowRx(!showRx)}
                  className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 h-6 rounded border transition-all ${showRx
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-inner'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300'
                    }`}
                >
                  <Eye className="w-3 h-3" />
                  Đơn Kính
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-300 ${showRx ? 'rotate-180' : ''}`}
                  />
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-between items-end mt-2.5">
            <div className="flex items-center bg-zinc-50 rounded-full p-0.5 border border-zinc-200">
              <button
                type="button"
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white text-zinc-500 disabled:opacity-30 transition-all active:scale-95 shadow-sm"
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-7 text-center text-xs font-black text-zinc-900">
                {item.quantity}
              </span>
              <button
                type="button"
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white text-zinc-500 transition-all active:scale-95 shadow-sm"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* NÂNG CẤP: Hiển thị đúng tổng tiền đã gồm tròng kính */}
            <p className="font-black text-zinc-900 text-[17px] tracking-tight">
              {rowTotal.toLocaleString('vi-VN')}₫
            </p>
          </div>
        </div>
      </div>

      {/* PHẦN DƯỚI: VÙNG CHI TIẾT ĐƠN KÍNH */}
      {showRx && hasPrescription && (
        <div className="bg-zinc-50/50 p-3.5 pt-0 border-t border-zinc-100 animate-in fade-in duration-200">
          <div className="h-4 w-full flex items-center justify-center mb-1">
            <div className="w-12 h-1 bg-zinc-200 rounded-full"></div>
          </div>

          <div className="flex flex-col gap-3">
            {(hasImage || hasManualInput) && (
              <div className="flex gap-3 items-start w-full">
                {hasImage && (
                  <div className={`flex flex-col gap-1.5 ${!hasManualInput ? 'w-full' : 'shrink-0 w-[72px]'}`}>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">
                      <FileText className="w-3 h-3" /> Ảnh
                    </span>
                    <img
                      src={item.prescription?.imageUrl || ''}
                      alt="Ảnh đơn kính"
                      className={`bg-white rounded-lg border border-zinc-200 shadow-sm transition-all ${!hasManualInput
                          ? 'w-full h-auto max-h-[250px] object-contain p-2'
                          : 'w-[72px] h-[72px] object-cover'
                        }`}
                    />
                  </div>
                )}

                {hasManualInput && (
                  <div className="flex-1 w-full bg-white rounded-xl border border-zinc-200 p-2 shadow-sm overflow-hidden">
                    <table className="w-full text-[11px] text-center border-collapse">
                      <thead>
                        <tr className="text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-100">
                          <th className="w-7 text-left pb-1.5 pl-1">Mắt</th>
                          <th className="pb-1.5">Cầu</th>
                          <th className="pb-1.5">Trụ</th>
                          <th className="pb-1.5">Trục</th>
                          <th className="pb-1.5">Cộng</th>
                        </tr>
                      </thead>
                      <tbody className="text-zinc-800 font-medium">
                        <tr className="border-b border-zinc-50 last:border-0">
                          <td className="text-zinc-900 text-left py-1.5 pl-1 font-black">Phải</td>
                          <td className="py-1.5">{item.prescription?.od?.sphere || '-'}</td>
                          <td className="py-1.5">{item.prescription?.od?.cylinder || '-'}</td>
                          <td className="py-1.5">{item.prescription?.od?.axis || '-'}</td>
                          <td className="py-1.5">{item.prescription?.od?.add || '-'}</td>
                        </tr>
                        <tr>
                          <td className="text-zinc-900 text-left py-1.5 pl-1 font-black">Trái</td>
                          <td className="py-1.5">{item.prescription?.os?.sphere || '-'}</td>
                          <td className="py-1.5">{item.prescription?.os?.cylinder || '-'}</td>
                          <td className="py-1.5">{item.prescription?.os?.axis || '-'}</td>
                          <td className="py-1.5">{item.prescription?.os?.add || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {item.prescription?.notes && (
              <div className="flex flex-col gap-1.5 mt-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                  Ghi chú
                </span>
                <div className="bg-white text-zinc-600 p-2.5 rounded-lg border border-zinc-200 text-[11px] shadow-sm leading-relaxed">
                  {item.prescription.notes}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};