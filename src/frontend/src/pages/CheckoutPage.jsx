import { CheckoutStepper } from '../feature/checkout/components/CheckoutStepper';
import { PaymentForm } from '../feature/checkout/components/PaymentForm';
import { ShippingForm } from '../feature/checkout/components/ShippingForm';
import { ReviewOrder } from '../feature/checkout/components/ReviewOrder';
import { OrderSummary } from '../feature/checkout/components/OrderSummary';
import { useCheckoutFlow } from '../feature/checkout/store/useCheckoutFlow';
import { useCartStore } from '../feature/product/store/useCartStore';
import { Navigate } from 'react-router-dom';

export default function CheckoutPage() {
  const { items } = useCartStore();
  const { step, setStep, handleContinue, handleBack } = useCheckoutFlow();

  if (items.length === 0) {
    return <Navigate to="/products" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 px-4 sm:px-6 lg:px-8 font-sans pt-24">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">Thanh toán</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Cột trái */}
          <div className="lg:col-span-7 xl:col-span-8">
            <CheckoutStepper currentStep={step} />

            <div className="min-h-[400px]">
              {step === 1 && <ShippingForm />}
              {step === 2 && <PaymentForm />}
              {step === 3 && <ReviewOrder onEdit={setStep} />}
            </div>
          </div>

          {/* Cột phải */}
          <div className="lg:col-span-5 xl:col-span-4">
            <OrderSummary step={step} onContinue={handleContinue} onBack={handleBack} />
          </div>
        </div>
      </div>
    </div>
  );
}
