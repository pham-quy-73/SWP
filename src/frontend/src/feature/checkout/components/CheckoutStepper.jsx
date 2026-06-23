import { CheckCircle2 } from 'lucide-react';

export const CheckoutStepper = ({ currentStep }) => {
  const steps = ['1. Giao hàng', '2. Thanh toán', '3. Xem lại'];

  return (
    <div className="flex border-b border-gray-100 mb-8 sm:mb-10">
      {steps.map((step, index) => {
        const isActive = index + 1 === currentStep;
        const isCompleted = index + 1 < currentStep;

        return (
          <div
            key={index}
            className={`pb-4 px-2 text-sm font-medium relative flex-1 text-center sm:text-left sm:flex-none sm:w-48 transition-colors
              ${isActive ? 'text-[#1e2575]' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}
          >
            <span className="flex items-center justify-center sm:justify-start gap-2">
              {isCompleted && <CheckCircle2 className="w-4 h-4" />}
              {step}
            </span>
            {isActive && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#1e2575]" />}
          </div>
        );
      })}
    </div>
  );
};
