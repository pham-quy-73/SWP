import { useCheckoutVnpay } from '../hooks/useCheckoutVnpay';
import { Loader2, CreditCard } from 'lucide-react';

export function VnpayCheckoutButton({ orderId, className }) {
  const { mutate, isPending } = useCheckoutVnpay();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        mutate(orderId);
      }}
      disabled={isPending}
      className={`relative w-full h-11 flex items-center justify-center rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50 ${className || ''}`}
    >
      {isPending ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Đang tạo link thanh toán...
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <CreditCard className="w-5 h-5" />
          Thanh toán qua VNPay
        </span>
      )}
    </button>
  );
}
