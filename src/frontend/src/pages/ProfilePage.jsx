import { useState, useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Save, User } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';

const API_URL = `${import.meta.env.VITE_API_URL}/api/users/profile`;

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
});

const ROLE_LABEL = { ADMIN: 'Quản trị viên', SALE: 'Nhân viên bán hàng', CUSTOMER: 'Khách hàng' };

export default function ProfilePage() {
  const { user, updateUser } = useContext(AuthContext);

  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', dob: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  if (!user) return <Navigate to="/login" replace />;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(API_URL, getAuthHeader());
        const u = res.data.data;
        setForm({
          first_name: u.first_name || '',
          last_name: u.last_name || '',
          phone: u.phone || '',
          dob: u.dob ? u.dob.slice(0, 10) : '',
        });
      } catch {
        setError('Không thể tải thông tin tài khoản');
      } finally {
        setIsFetching(false);
      }
    };
    fetchProfile();
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'Họ không được để trống';
    if (!form.last_name.trim()) errs.last_name = 'Tên không được để trống';
    return errs;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    setSuccess(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setIsLoading(true);
    setError('');
    setSuccess(false);
    try {
      const res = await axios.put(API_URL, {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim() || null,
        dob: form.dob || null,
      }, getAuthHeader());
      updateUser(res.data.data);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full h-12 px-4 rounded-2xl bg-zinc-50 border-2 text-sm font-medium transition-all duration-200 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-zinc-900/5 ${
      fieldErrors[field] ? 'border-red-300 focus:border-red-400' : 'border-transparent focus:border-zinc-200 hover:bg-zinc-100'
    }`;

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-6">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="mb-10">
            <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 font-bold">Tài khoản</span>
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight mt-2">Thông Tin Cá Nhân</h1>
            <div className="w-10 h-1 bg-emerald-500 rounded-full mt-3" />
          </div>

          {/* Avatar + Role */}
          <div className="flex items-center gap-5 mb-8 p-5 bg-white rounded-3xl border border-zinc-100 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <User className="w-7 h-7 text-white" />
              )}
            </div>
            <div>
              <p className="font-black text-zinc-900 text-base">{user.first_name} {user.last_name}</p>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">@{user.username}</p>
              <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold tracking-widest uppercase">
                {ROLE_LABEL[user.role] || user.role}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-8 space-y-5">
            {/* Read-only info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-2">Email</label>
                <div className="h-12 px-4 rounded-2xl bg-zinc-100 border-2 border-transparent flex items-center text-sm text-zinc-500 font-medium select-none">
                  {user.email}
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-2">Tên đăng nhập</label>
                <div className="h-12 px-4 rounded-2xl bg-zinc-100 border-2 border-transparent flex items-center text-sm text-zinc-500 font-medium select-none">
                  {user.username}
                </div>
              </div>
            </div>

            {/* Editable fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-2">Họ</label>
                <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="Họ" className={inputClass('first_name')} />
                {fieldErrors.first_name && <p className="mt-1 text-[11px] text-red-500 font-medium pl-1">{fieldErrors.first_name}</p>}
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-2">Tên</label>
                <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Tên" className={inputClass('last_name')} />
                {fieldErrors.last_name && <p className="mt-1 text-[11px] text-red-500 font-medium pl-1">{fieldErrors.last_name}</p>}
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-2">Số điện thoại</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="Số điện thoại" className={inputClass('phone')} />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-2">Ngày sinh</label>
              <input name="dob" type="date" value={form.dob} onChange={handleChange} className={inputClass('dob')} />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                <p className="text-sm text-red-600 font-medium text-center">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-sm text-emerald-700 font-medium text-center">Cập nhật thông tin thành công!</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-2xl bg-zinc-900 hover:bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-60 hover:shadow-lg hover:-translate-y-0.5"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /><span>LƯU THAY ĐỔI</span></>}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
