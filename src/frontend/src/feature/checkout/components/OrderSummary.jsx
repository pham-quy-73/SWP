import { Lock, ShieldCheck, Loader2, Info } from 'lucide-react';
import { useCartStore } from '../../product/store/useCartStore';
import { usePaymentRequirement } from '../hooks/usePaymentRequirement';

export const OrderSummary = ({ step, onContinue, onBack }) => {
  const { items } = useCartStore();
  const { data: response, isLoading, isError } = usePaymentRequirement();
  const result = response?.result;

  if (isLoading && items.length > 0) {
    return (
      <div className="sticky top-8 border border-gray-100 rounded-2xl bg-white p-8 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#4A8795]" />
        <p className="text-sm text-gray-500 animate-pulse font-semibold">
          Đang tính toán chi tiết đơn hàng...
        </p>
      </div>
    );
  }

  return (
    <div className="sticky top-8 border border-gray-100 shadow-sm overflow-hidden bg-white rounded-2xl animate-in fade-in slide-in-from-right-4 duration-700">
      <div className="bg-gray-50/50 pb-4 p-5 border-b border-gray-100">
        <h3 className="text-lg flex justify-between items-center font-bold text-gray-900">
          Tóm tắt đơn hàng
          <span className="text-xs font-normal text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200">
            {items.length} sản phẩm
          </span>
        </h3>
      </div>

      <div className="space-y-6 p-5">
        <div className="max-h-[300px] overflow-y-auto pr-1 space-y-4 scrollbar-thin">
          {items.map((item, index) => {
            const itemDetail = result?.itemRequirements?.[index];
            const itemPayPercent = itemDetail ? Math.round(itemDetail.paymentPercentage * 100) : 0;

            return (
              <div key={item.id} className="flex gap-4 group">
                <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.orderType === 'pre-order' && (
                    <div className="absolute top-0 right-0 z-10">
                      <div className="absolute top-[6px] right-[-24px] rotate-45 bg-orange-500 text-white text-[9px] font-bold px-7 py-0.5 shadow-sm">
                        PRE
                      </div>
                    </div>
                  )}
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-sm truncate text-gray-800">{item.name}</h4>
                    <p className="font-bold text-sm text-[#1e2575]">
                      {(itemDetail?.itemTotal || (item.price * item.quantity)).toLocaleString()}₫
                    </p>
                  </div>

                  <div className="text-[11px] text-gray-500 mt-1 space-y-1">
                    <div className="flex justify-between">
                      <span>Đơn giá gọng (x{item.quantity}):</span>
                      <span>{(itemDetail?.unitPrice || item.price).toLocaleString()}₫</span>
                    </div>

                    {itemDetail && itemDetail.lensPrice > 0 && (
                      <div className="flex justify-between text-[#4A8795] font-semibold italic">
                        <span>+ Giá tròng:</span>
                        <span>{itemDetail.lensPrice.toLocaleString()}₫</span>
                      </div>
                    )}

                    {itemDetail && (
                      <div className="flex justify-between py-1 px-2 bg-gray-50 rounded border border-dashed border-gray-200 mt-1.5 text-[10px]">
                        <span className="font-semibold text-gray-600">
                          Cần thanh toán trước ({itemPayPercent}%):
                        </span>
                        <span className="font-black text-[#1e2575]">
                          {itemDetail.requiredPayment.toLocaleString()}₫
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="h-px bg-gray-200 w-full" />

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 font-medium">Tổng giá trị đơn hàng</span>
            <span className="font-bold text-gray-900">
              {(result?.orderTotal || items.reduce((sum, item) => sum + item.price * item.quantity, 0)).toLocaleString()}₫
            </span>
          </div>

          {result && result.requiredAmount < result.orderTotal && (
            <div className="flex justify-between items-center text-amber-700 bg-amber-50 p-2 rounded-lg text-[12px] border border-amber-100">
              <span className="flex items-center gap-1 font-semibold">
                <Info className="w-3.5 h-3.5" />
                Yêu cầu cọc
              </span>
              <span className="font-bold">{result.requiredAmount.toLocaleString()}₫</span>
            </div>
          )}
        </div>

        <div className="h-px bg-gray-200 w-full" />

        <div className="bg-[#1e2575]/5 p-4 rounded-xl space-y-2 border border-[#1e2575]/10 shadow-inner">
          <div className="flex justify-between items-center">
            <div className="text-xs font-bold text-[#1e2575] uppercase tracking-wider">
              Thanh toán ngay
            </div>
            <div className="text-2xl font-black tracking-tighter text-[#1e2575]">
              {(result?.requiredPaymentTotal || items.reduce((sum, item) => sum + item.price * item.quantity, 0)).toLocaleString()}₫
            </div>
          </div>

          {result && result.remainingPaymentTotal > 0 && (
            <div className="flex justify-between text-[11px] text-gray-500 italic border-t border-[#1e2575]/10 pt-2 font-medium">
              <span>Còn lại (Thanh toán khi có hàng)</span>
              <span className="font-bold text-gray-700">
                {result.remainingPaymentTotal.toLocaleString()}₫
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 bg-gray-50/50 p-5 pt-0 border-t border-gray-100">
        <button
          onClick={onContinue}
          disabled={items.length === 0 || isError}
          className="w-full h-12 text-sm bg-[#1e2575] hover:bg-[#151b54] text-white font-bold shadow-lg transition-all active:scale-[0.98] rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isError ? (
            'Lỗi tính toán'
          ) : (
            <>
              <Lock className="w-4 h-4" />
              {step === 3
                ? `Thanh toán ngay ${(result?.requiredAmount || items.reduce((sum, item) => sum + item.price * item.quantity, 0)).toLocaleString()}₫`
                : 'Tiếp tục thanh toán'}
            </>
          )}
        </button>

        {step > 1 && (
          <button
            onClick={onBack}
            className="w-full h-10 text-gray-500 hover:text-gray-900 bg-transparent text-sm font-semibold rounded-xl hover:bg-zinc-100 transition-colors"
          >
            Quay lại bước trước
          </button>
        )}

        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold pt-2 uppercase tracking-widest">
          <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
          Giao dịch được bảo mật bởi SSL
        </div>
      </div>
    </div>
  );
};
