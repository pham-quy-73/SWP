import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
    const categories = [
        {
            title: "Kính Nam",
            img: "/images/men.webp"
        },
        {
            title: "Kính Nữ",
            img: "/images/women.webp"
        },
        {
            title: "Gọng Unisex",
            img: "/images/unisex.webp"
        }
    ];

    return (
        <div className="overflow-hidden bg-white">

            {/* HERO SECTION */}
            <section className="relative min-h-screen flex items-center bg-gradient-to-b from-white via-zinc-50 to-zinc-100">

                {/* Glow Background */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-emerald-200/20 blur-3xl rounded-full pointer-events-none"></div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* TEXT */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >

                        <span className="inline-flex items-center px-4 py-1.5 bg-white border border-zinc-200 text-zinc-500 text-[10px] font-bold tracking-[0.3em] uppercase rounded-full shadow-sm mb-8">
                            SWP391 - Group4
                        </span>

                        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black leading-[0.9] tracking-[-0.06em] text-zinc-900 mb-8">
                            Dẫn Đầu <br />
                            <span className="text-zinc-300">
                                Xu Hướng.
                            </span>
                        </h1>

                        <p className="text-zinc-500 text-lg leading-relaxed max-w-xl mb-10">
                            Nơi nghệ thuật chế tác thủ công gặp gỡ công nghệ tương lai. Không chỉ là phụ kiện, chúng tôi định nghĩa lại cách thế giới nhìn nhận phong cách cá nhân qua từng đường nét thiết kế tiên phong.
                        </p>

                        <div className="flex flex-wrap gap-4">

                            <Link to="/products" className="group flex items-center gap-3 bg-zinc-900 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:bg-emerald-600 hover:shadow-2xl hover:shadow-emerald-500/30">
                                KHÁM PHÁ NGAY
                                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                            </Link>

                            <button className="px-8 py-4 rounded-2xl border border-zinc-300 text-zinc-700 font-semibold hover:bg-zinc-100 transition-all duration-300">
                                XEM LOOKBOOK
                            </button>

                        </div>
                    </motion.div>

                    {/* IMAGE */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="relative"
                    >

                        {/* Glow */}
                        <div className="absolute -inset-8 bg-emerald-200/30 rounded-[50px] blur-3xl"></div>

                        {/* Glass Card */}
                        <div className="relative rounded-[40px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.18)] border border-white/40 backdrop-blur-sm">

                            <img
                                src="https://images.unsplash.com/photo-1577803645773-f96470509666?w=1000"
                                alt="Luxury Glasses"
                                className="w-full aspect-[4/5] object-cover transition-transform duration-700 hover:scale-105"
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>

                        </div>

                    </motion.div>

                </div>
            </section>

            {/* CATEGORY SECTION */}
            <section className="py-32 bg-zinc-50 border-t border-zinc-100">

                <div className="max-w-7xl mx-auto px-6">

                    {/* Heading */}
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">

                        <div>
                            <span className="text-xs uppercase tracking-[0.3em] text-zinc-400 font-bold">
                                Categories
                            </span>

                            <h2 className="text-4xl font-black text-zinc-900 tracking-tight mt-3 mb-3">
                                Mua Sắm Theo Đối Tượng
                            </h2>

                            <div className="w-16 h-1 bg-emerald-500 rounded-full"></div>
                        </div>

                        <Link
                            to="/products"
                            className="text-sm font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
                        >
                            Xem tất cả +
                        </Link>

                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                        {categories.map((cat, index) => (
                            <Link key={index} to="/products" className="block">
                            <motion.div
                                whileHover={{ y: -12 }}
                                transition={{ duration: 0.3 }}
                                className="group relative overflow-hidden rounded-[32px] bg-white border border-zinc-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] cursor-pointer"
                            >

                                <div className="aspect-[4/5] overflow-hidden">

                                    <img
                                        src={cat.img}
                                        alt={cat.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />

                                </div>

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

                                {/* Content */}
                                <div className="absolute bottom-8 left-8 right-8">

                                    <h3 className="text-white text-3xl font-black opacity-0 translate-y-5 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                        {cat.title}
                                    </h3>

                                    <p className="text-white/70 mt-2 text-sm opacity-0 translate-y-5 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700">
                                        Khám phá bộ sưu tập mới nhất
                                    </p>

                                </div>

                            </motion.div>
                            </Link>
                        ))}

                    </div>

                </div>
            </section>

        </div>
    );
}

