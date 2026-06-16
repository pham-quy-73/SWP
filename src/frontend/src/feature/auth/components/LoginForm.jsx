import { Link } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import { useLoginForm } from '../hooks/useLoginForm';
import { GoogleLogin } from '@react-oauth/google'; // Import component của Google

export default function LoginForm() {
  const { form, onSubmit, isLoading, handleGoogleLogin } = useLoginForm(); // Lấy thêm hàm handleGoogleLogin
  const { register, handleSubmit, formState: { errors } } = form;

  return (
    <div className="w-full">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-extrabold text-zinc-900 mb-2">Chào mừng bạn đến với OpticStore</h2>
        <p className="text-zinc-500 text-sm">Vui lòng nhập thông tin để đăng nhập.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        <div className="relative group">
          <input
            {...register('username')}
            type="text"
            placeholder="TÊN ĐĂNG NHẬP / EMAIL"
            disabled={isLoading}
            className={`w-full h-14 px-6 rounded-2xl bg-zinc-50/80 border-2 text-sm font-medium transition-all duration-300 placeholder:text-zinc-400 placeholder:text-xs placeholder:tracking-widest focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 ${errors.username ? 'border-red-400 focus:border-red-500' : 'border-transparent focus:border-zinc-200 hover:bg-zinc-100/80'
              }`}
          />
          {errors.username && <p className="absolute -bottom-5 left-2 text-[11px] text-red-500 font-medium">{errors.username.message}</p>}
        </div>

        <div className="relative group">
          <input
            {...register('password')}
            type="password"
            placeholder="MẬT KHẨU"
            disabled={isLoading}
            className={`w-full h-14 px-6 rounded-2xl bg-zinc-50/80 border-2 text-sm font-medium transition-all duration-300 placeholder:text-zinc-400 placeholder:text-xs placeholder:tracking-widest focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 ${errors.password ? 'border-red-400 focus:border-red-500' : 'border-transparent focus:border-zinc-200 hover:bg-zinc-100/80'
              }`}
          />
          {errors.password && <p className="absolute -bottom-5 left-2 text-[11px] text-red-500 font-medium">{errors.password.message}</p>}
        </div>

        {errors.root && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100 text-center animate-pulse">
            <p className="text-sm text-red-600 font-medium">{errors.root.message}</p>
          </div>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 rounded-2xl bg-zinc-900 hover:bg-zinc-800 hover:shadow-lg hover:-translate-y-0.5 text-white font-bold tracking-widest text-sm flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-70 disabled:transform-none"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>ĐĂNG NHẬP</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </form>

      {/* Dải phân cách */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200"></div>
        </div>
        <div className="relative flex justify-center text-xs font-bold tracking-widest">
          <span className="bg-white px-4 text-zinc-400">HOẶC TIẾP TỤC VỚI</span>
        </div>
      </div>

      <div className="flex justify-center w-full rounded-2xl overflow-hidden mt-2">
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            handleGoogleLogin(credentialResponse.credential);
          }}
          onError={() => {
            console.log('Google Login Failed');
          }}
          theme="outline"
          size="large"
          width="100%"
          shape="rectangular"
          logo_alignment="center"
          text="signin_with"
        />
      </div>

      <div className="mt-12 text-center text-sm text-zinc-500">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-bold text-zinc-900 hover:text-emerald-600 transition-colors">
          Đăng ký miễn phí
        </Link>
      </div>
    </div>
  );
}