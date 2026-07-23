import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Lock,
  Edit3,
  Save,
  X,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { useProfileQuery } from '../hooks/useProfileQuery';
import { profileApi } from '../api/api';

const SectionTitle = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider mb-6">
    <Icon className="w-4 h-4 text-[#1e2575]" />
    <span>{title}</span>
  </div>
);

export default function ProfilePage() {
  const { data: profile, isLoading, isError, refetch } = useProfileQuery();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dob: ''
  });

  // Modal đổi mật khẩu
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [passData, setPassData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || profile.first_name || '',
        lastName: profile.lastName || profile.last_name || '',
        phone: profile.phone || '',
        dob: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : ''
      });
    }
  }, [profile]);

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e2575]" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="p-8 text-center text-gray-500 border border-dashed rounded-xl mt-4">
        <p>Không tìm thấy thông tin cá nhân hoặc phiên đăng nhập đã hết hạn.</p>
      </div>
    );
  }

  const safeRoles = profile.roles || (profile.role ? [{ name: profile.role }] : []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('Họ và tên không được để trống!');
      return;
    }

    setSaving(true);
    try {
      await profileApi.updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        dob: formData.dob
      });
      toast.success('Cập nhật thông tin cá nhân thành công!');
      refetch();
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật thông tin. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passData.oldPassword || !passData.newPassword) {
      toast.error('Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    if (passData.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }
    if (passData.newPassword !== passData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    setChangingPass(true);
    try {
      await profileApi.changePassword({
        oldPassword: passData.oldPassword,
        newPassword: passData.newPassword
      });
      toast.success('Đổi mật khẩu thành công!');
      setShowPasswordModal(false);
      setPassData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-500 font-sans">
      <div className="p-4 sm:p-8 space-y-8 sm:space-y-10">
        {/* --- 1. PHẦN ĐẦU & ẢNH ĐẠI DIỆN --- */}
        <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
          <div className="flex gap-6 items-center">
            {/* Khung chứa ảnh đại diện */}
            <div className="h-24 w-24 rounded-full bg-gray-100 overflow-hidden border-4 border-white shadow-sm shrink-0 relative group">
              <img
                src={
                  profile.imageUrl ||
                  profile.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent((profile.firstName || profile.first_name || '') + ' ' + (profile.lastName || profile.last_name || ''))}&background=1e2575&color=fff`
                }
                alt="Ảnh đại diện"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>

            {/* Tên & Tên đăng nhập */}
            <div className="space-y-2">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {profile.firstName || profile.first_name} {profile.lastName || profile.last_name}
                </h1>
                <p className="text-sm text-gray-500 font-semibold mt-0.5">@{profile.username}</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#1e2575] font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" /> Chỉnh sửa thông tin
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" /> Hủy chỉnh sửa
              </button>
            )}

            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <KeyRound className="w-4 h-4 text-amber-500" /> Đổi mật khẩu
            </button>
          </div>
        </div>

        <div className="h-px bg-gray-100 w-full" />

        {/* --- 2. THÔNG TIN ĐỊNH DANH --- */}
        <form onSubmit={handleSaveProfile}>
          <SectionTitle icon={User} title="Thông tin định danh" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-0.5">Họ</label>
              <input
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                readOnly={!isEditing}
                className={`w-full h-11 px-3.5 border text-gray-700 font-semibold rounded-xl focus:outline-none transition-all ${
                  isEditing ? 'bg-white border-indigo-300 focus:ring-2 focus:ring-[#1e2575]/20' : 'bg-gray-50 border-gray-100'
                }`}
                placeholder="Nhập họ..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-0.5">Tên</label>
              <input
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                readOnly={!isEditing}
                className={`w-full h-11 px-3.5 border text-gray-700 font-semibold rounded-xl focus:outline-none transition-all ${
                  isEditing ? 'bg-white border-indigo-300 focus:ring-2 focus:ring-[#1e2575]/20' : 'bg-gray-50 border-gray-100'
                }`}
                placeholder="Nhập tên..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-0.5">Ngày sinh</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData(prev => ({ ...prev, dob: e.target.value }))}
                readOnly={!isEditing}
                className={`w-full h-11 px-3.5 border text-gray-700 font-semibold rounded-xl focus:outline-none transition-all ${
                  isEditing ? 'bg-white border-indigo-300 focus:ring-2 focus:ring-[#1e2575]/20' : 'bg-gray-50 border-gray-100'
                }`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-0.5">Số điện thoại</label>
              <input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                readOnly={!isEditing}
                className={`w-full h-11 px-3.5 border text-gray-700 font-semibold rounded-xl focus:outline-none transition-all ${
                  isEditing ? 'bg-white border-indigo-300 focus:ring-2 focus:ring-[#1e2575]/20' : 'bg-gray-50 border-gray-100'
                }`}
                placeholder="Chưa cung cấp số điện thoại"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-[#1e2575] hover:bg-indigo-900 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu thay đổi
              </button>
            </div>
          )}
        </form>

        {/* --- 3. CHI TIẾT LIÊN HỆ --- */}
        <div>
          <SectionTitle icon={Mail} title="Liên hệ & Bảo mật" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-0.5">Địa chỉ Email</label>
              <div className="relative group">
                <input
                  value={profile.email || ''}
                  className="w-full h-11 pl-3.5 pr-28 bg-gray-50 border border-gray-100 text-gray-700 font-semibold rounded-xl focus:outline-none"
                  readOnly
                />
                <div className="absolute right-3 top-2.5 flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide cursor-help">
                  <CheckCircle2 className="w-3 h-3" /> Đã xác minh
                </div>
              </div>
            </div>
          </div>

          {/* --- PHẦN VAI TRÒ & QUYỀN HẠN --- */}
          <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-gray-400" />
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Vai trò & Quyền hạn hoạt động
              </h4>
            </div>

            <div className="flex flex-wrap gap-2">
              {safeRoles.length > 0 ? (
                safeRoles.map((role, index) => (
                  <div
                    key={index}
                    className="group relative bg-white border border-gray-200 px-3.5 py-2 rounded-xl shadow-xs hover:border-zinc-300 transition-colors cursor-default"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="text-xs font-bold text-gray-700">{role.name || role}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">Thành viên</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL ĐỔI MẬT KHẨU */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Đổi mật khẩu</h3>
                  <p className="text-xs text-gray-400 font-medium">Bảo vệ tài khoản với mật khẩu mới</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Mật khẩu hiện tại</label>
                <div className="relative">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    value={passData.oldPassword}
                    onChange={(e) => setPassData(prev => ({ ...prev, oldPassword: e.target.value }))}
                    className="w-full h-11 pl-3.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-indigo-500"
                    placeholder="Nhập mật khẩu hiện tại..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={passData.newPassword}
                    onChange={(e) => setPassData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full h-11 pl-3.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-indigo-500"
                    placeholder="Tối thiểu 6 ký tự..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={passData.confirmPassword}
                  onChange={(e) => setPassData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full h-11 px-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-indigo-500"
                  placeholder="Nhập lại mật khẩu mới..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={changingPass}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-[#1e2575] hover:bg-indigo-900 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {changingPass && <Loader2 className="w-4 h-4 animate-spin" />}
                  Cập nhật mật khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
