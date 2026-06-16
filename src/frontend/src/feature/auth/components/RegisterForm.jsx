import { Link } from 'react-router-dom';
import { Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useRegisterForm } from '../hooks/useRegisterForm';

export default function RegisterForm() {
  // Lấy apiError ra thay vì dùng của form
  const { form, onSubmit, isLoading, isSuccess, apiError } = useRegisterForm();
  const { register, handleSubmit, formState: { errors } } = form;

  const inputClass = (error) => `w-full h-14 px-6 rounded-2xl bg-zinc-50/80 border-2 text-sm font-medium transition-all duration-300 placeholder:text-zinc-400 placeholder:text-xs placeholder:tracking-widest focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 ${
    error ? 'border-red-400 focus:border-red-500' : 'border-transparent focus:border-zinc-200 hover:bg-zinc-100/80'
  }`;

  return (
    <div className="w-full">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-zinc-900 mb-2">Tạo tài khoản mới</h2>
        <p className="text-zinc-500 text-sm">Gia nhập OpticStore ngay hôm nay.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="space-y-6">
          <div className="relative">
            <input {...register('username')} type="text" placeholder="TÊN ĐĂNG NHẬP" disabled={isLoading || isSuccess} className={inputClass(errors.username)} />
            {errors.username && <p className="absolute -bottom-5 left-2 text-[11px] text-red-500 font-medium">{errors.username.message}</p>}
          </div>

          <div className="relative">
            <input {...register('email')} type="email" placeholder="ĐỊA CHỈ EMAIL" disabled={isLoading || isSuccess} className={inputClass(errors.email)} />
            {errors.email && <p className="absolute -bottom-5 left-2 text-[11px] text-red-500 font-medium">{errors.email.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <input {...register('last_name')} type="text" placeholder="HỌ" disabled={isLoading || isSuccess} className={inputClass(errors.last_name)} />
            {errors.last_name && <p className="absolute -bottom-5 left-2 text-[11px] text-red-500 font-medium">{errors.last_name.message}</p>}
          </div>
          <div className="relative">
            <input {...register('first_name')} type="text" placeholder="TÊN" disabled={isLoading || isSuccess} className={inputClass(errors.first_name)} />
            {errors.first_name && <p className="absolute -bottom-5 left-2 text-[11px] text-red-500 font-medium">{errors.first_name.message}</p>}
          </div>
        </div>

        <div className="relative">
          <input {...register('password')} type="password" placeholder="MẬT KHẨU" disabled={isLoading || isSuccess} className={inputClass(errors.password)} />
          {errors.password && <p className="absolute -bottom-5 left-2 text-[11px] text-red-500 font-medium">{errors.password.message}</p>}
        </div>

        {/* SỬA ĐỔI: Dùng apiError độc lập. Đã bỏ hiệu ứng animate để chữ không bị chớp */}
        {!isSuccess && apiError && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 text-center transition-colors duration-300">
            <p className="text-sm text-red-600 font-medium">{apiError}</p>
          </div>
        )}

        {isSuccess && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex flex-col items-center justify-center gap-2 animate-[fadeIn_0.3s_ease-out]">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <p className="text-sm text-emerald-700 font-semibold text-center">Đăng ký thành công!</p>
            <p className="text-xs text-emerald-600/80 text-center">Vui lòng kiểm tra hộp thư email của bạn để kích hoạt tài khoản.</p>
          </div>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading || isSuccess}
            className="w-full h-14 rounded-2xl bg-zinc-900 hover:bg-zinc-800 hover:shadow-lg hover:-translate-y-0.5 text-white font-bold tracking-widest text-sm flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-70 disabled:transform-none"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{isSuccess ? 'ĐÃ GỬI YÊU CẦU' : 'ĐĂNG KÝ NGAY'}</span>
                {!isSuccess && <ArrowRight className="w-4 h-4" />}
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-8 text-center text-sm text-zinc-500">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-bold text-zinc-900 hover:text-emerald-600 transition-colors">
          Đăng nhập
        </Link>
      </div>
    </div>
  );
}