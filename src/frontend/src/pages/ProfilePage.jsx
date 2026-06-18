import { useContext, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { User, Lock, Mail, Loader2, Calendar, Phone } from 'lucide-react';

export default function ProfilePage() {
    const { user, loginContext } = useContext(AuthContext);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        phone: user?.phone || '',
        dob: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:5000/api/users/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Cập nhật lại Context State ngay lập tức
                loginContext(data.user, token);
                setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công.' });
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Lỗi kết nối đến máy chủ.' });
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = "w-full h-14 px-6 rounded-2xl bg-zinc-50 border-2 border-transparent text-sm font-medium transition-all duration-300 focus:bg-white focus:border-zinc-200 focus:outline-none focus:ring-4 focus:ring-zinc-900/5 hover:bg-zinc-100/80";
    const labelClass = "text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 block ml-2";

    return (
        <div className="pt-32 pb-20 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">

            {/* Sidebar Navigation */}
            <div className="lg:col-span-3 space-y-2">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-zinc-900 tracking-tighter">Tài khoản</h1>
                    <p className="text-zinc-500 text-sm mt-2">Quản lý thông tin và bảo mật</p>
                </div>

                <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all bg-zinc-900 text-white shadow-lg">
                    <User className="w-4 h-4" />
                    Thông tin cá nhân
                </button>
                <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900">
                    <Lock className="w-4 h-4" />
                    Đổi mật khẩu
                </button>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-9 bg-white border border-zinc-100 rounded-[32px] p-8 md:p-12 shadow-sm">
                <h2 className="text-xl font-bold text-zinc-900 mb-8 uppercase tracking-widest">Hồ sơ của tôi</h2>

                {message && (
                    <div className={`p-4 mb-6 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Họ</label>
                            <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Tên</label>
                            <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className={inputClass} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Số điện thoại</label>
                            <div className="relative flex items-center">
                                <Phone className="w-5 h-5 text-zinc-400 absolute left-5" />
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={`${inputClass} pl-14`} />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Ngày sinh</label>
                            <div className="relative flex items-center">
                                <Calendar className="w-5 h-5 text-zinc-400 absolute left-5" />
                                <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={`${inputClass} pl-14`} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Email / Tên đăng nhập (Không thể thay đổi)</label>
                        <div className="relative flex items-center">
                            <Mail className="w-5 h-5 text-zinc-400 absolute left-5" />
                            <input type="email" value={user?.email || ''} disabled className={`${inputClass} pl-14 opacity-60 cursor-not-allowed`} />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-100">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="h-14 px-8 rounded-full bg-zinc-900 hover:bg-emerald-600 text-white font-bold tracking-widest text-xs uppercase flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-70 disabled:hover:bg-zinc-900"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu thay đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}