import { useCheckoutStore } from '../store/useCheckoutStore';
import { CheckCircle2, CreditCard, Landmark } from 'lucide-react';

const Input = ({ className, ...props }) => (
  <input
    className={`file:text-foreground placeholder:text-gray-400 border border-gray-200 h-9 w-full min-w-0 rounded-xl bg-transparent px-3 py-1 text-base transition-all outline-none disabled:pointer-events-none disabled:opacity-50 md:text-sm focus:border-[#4A8795]  focus:ring-[#4A8795]/20 focus:ring-1 ${className || ''}`}
    {...props}
  />
);

export const PaymentForm = () => {
  const { paymentMethod, setPaymentMethod, bankInfo, updateBankInfo } = useCheckoutStore();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          Phương thức thanh toán
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* LỰA CHỌN VNPAY */}
          <div
            onClick={() => setPaymentMethod('VNPAY')}
            className="relative flex flex-col items-center justify-between rounded-2xl border-2 p-6 cursor-pointer transition-all h-full bg-[#4A8795]/5 border-[#4A8795]"
          >
            <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-[#4A8795]" />
            <div className="p-3 bg-blue-105 bg-[#4A8795]/10 rounded-full mb-3">
              <CreditCard className="h-6 w-6 text-[#4A8795]" />
            </div>
            <span className="font-bold text-gray-900">VNPay</span>
            <span className="text-[10px] text-gray-500 mt-1 text-center font-medium">
              Thanh toán qua QR, Thẻ ATM/Nội địa
            </span>
          </div>
        </div>
      </div>

      {/* HIỂN THỊ THÔNG TIN CHI TIẾT */}
      <div className="p-6 rounded-2xl bg-gray-50 border border-dashed border-gray-200 animate-in fade-in duration-300">
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-gray-800">Cổng thanh toán VNPay</h3>
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            Bạn sẽ được chuyển hướng đến cổng thanh toán VNPay sau khi bấm "Đặt hàng". Vui lòng
            không đóng trình duyệt cho đến khi nhận được thông báo thành công.
          </p>
        </div>
      </div>

      {/* FORM NHẬP THÔNG TIN NGÂN HÀNG */}
      <div className="space-y-5 pt-2 border-t border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <div className="p-2 bg-[#4A8795]/10 rounded-lg">
            <Landmark className="w-5 h-5 text-[#4A8795]" />
          </div>
          Thông tin ngân hàng (nhận hoàn tiền)
          <span className="text-xs font-semibold text-gray-605 bg-gray-50 border border-gray-200 px-2 py-1 rounded-full ml-2">
            Không bắt buộc
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-6 rounded-2xl border border-gray-100 bg-white shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
          {/* Tên ngân hàng */}
          <div className="space-y-2">
            <label htmlFor="bankName" className="text-sm font-semibold text-gray-700 ml-1">
              Tên ngân hàng
            </label>
            <Input
              id="bankName"
              placeholder="VD: Vietcombank, MB Bank..."
              className="h-11 bg-gray-50/50 border-gray-200 focus:border-[#4A8795] focus:bg-white"
              value={bankInfo?.bankName || ''}
              onChange={(e) => updateBankInfo({ ...bankInfo, bankName: e.target.value })}
            />
          </div>

          {/* Số tài khoản */}
          <div className="space-y-2">
            <label htmlFor="bankAccountNumber" className="text-sm font-semibold text-gray-700 ml-1">
              Số tài khoản
            </label>
            <Input
              id="bankAccountNumber"
              placeholder="Nhập số tài khoản"
              className="h-11 bg-gray-50/50 border-gray-200 focus:border-[#4A8795] focus:bg-white"
              value={bankInfo?.bankAccountNumber || ''}
              onChange={(e) => updateBankInfo({ ...bankInfo, bankAccountNumber: e.target.value })}
            />
          </div>

          {/* Tên chủ tài khoản */}
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="accountHolderName" className="text-sm font-semibold text-gray-700 ml-1">
              Tên chủ tài khoản
            </label>
            <Input
              id="accountHolderName"
              placeholder="NGUYEN VAN A"
              className="h-11 bg-gray-50/50 border-gray-200 focus:border-[#4A8795] focus:bg-white uppercase"
              value={bankInfo?.accountHolderName || ''}
              onChange={(e) =>
                updateBankInfo({ ...bankInfo, accountHolderName: e.target.value.toUpperCase() })
              }
            />
          </div>
        </div>
      </div>

    </div>
  );
};
