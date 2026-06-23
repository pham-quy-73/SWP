import React from 'react';
import Header from './Header';
import Footer from './Footer';

export default function AuthLayout({ children }) {
  return (
    <>
      {/* Header chung */}
      <Header />

      {/* Auth Section */}
      <div className="min-h-screen bg-zinc-100 flex flex-col justify-center items-center pt-28 pb-12 p-4 sm:px-8 font-sans">
        <div className="flex flex-col md:flex-row w-full max-w-[1200px] min-h-[700px] bg-white rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-2xl shadow-zinc-200/50 border border-zinc-100">

          {/* Nửa trái: Branding */}
          <div className="relative hidden md:flex flex-col justify-between w-1/2 p-12 overflow-hidden bg-zinc-900 text-white">
            <img
              src="/images/auth-background.webp"
              alt="OpticStore Background"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
            />

            <div className="absolute inset-0 bg-black/40"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

            {/* Logo */}
            <div className="relative z-10 flex items-center gap-2">
              <svg
                className="w-8 h-8 text-white drop-shadow-md"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>

              <span className="text-xl font-bold tracking-widest uppercase text-white drop-shadow-md">
                OpticStore
              </span>
            </div>

            {/* Typography */}
            <div className="relative z-10 mb-8">
              <span className="inline-block py-1.5 px-4 mb-6 text-[11px] font-bold tracking-wider text-emerald-400 bg-black/60 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
                BỘ SƯU TẬP MỚI
              </span>

              <h1 className="text-6xl lg:text-[4.5rem] font-serif mb-6 leading-[1.15] text-white tracking-tight drop-shadow-2xl">
                <span className="inline-block">Phong cách</span>
                <br />
                <span className="italic text-white/90">
                  được tái định
                </span>
                <br />
                nghĩa.
              </h1>

              <p className="text-white/90 max-w-sm text-sm leading-relaxed font-medium drop-shadow-lg">
                Kính mắt cao cấp được thiết kế cho những người hiện đại.
                Trải nghiệm sự rõ nét và phong cách hoàn toàn mới.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="w-full md:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-20 bg-white">
            <div className="w-full max-w-md animate-[fadeIn_0.5s_ease-out]">
              {children}
            </div>
          </div>

        </div>
      </div>

      {/* Footer chung */}
      <Footer />
    </>
  );
}