import { useState, useEffect } from 'react';
import {
  Search, MoreHorizontal, Trash2, Lock, Unlock, Loader2, User as UserIcon, ShieldCheck, KeyRound, X, ShieldAlert, Plus
} from 'lucide-react';
import {
  useAdminUsers,
  useUpdateUserStatus,
  useDeleteUser,
  useResetUserPassword,
  useCreateUser
} from '../hooks/useAdminUsers';

export default function UserManagePage() {
  // States cơ bản
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, CUSTOMER, MANAGER, ADMIN
  const [page, setPage] = useState(1);
  const [openActionId, setOpenActionId] = useState(null);

  // States cho tính năng Đổi mật khẩu
  const [resetModal, setResetModal] = useState({ isOpen: false, userId: null, userName: '' });
  const [newPassword, setNewPassword] = useState('');

  // States cho tính năng Tạo tài khoản
  const [createModal, setCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    role: 'MANAGER' // Mặc định là MANAGER
  });

  useEffect(() => {
    const handleClickGlobal = () => setOpenActionId(null);
    window.addEventListener('click', handleClickGlobal);
    return () => window.removeEventListener('click', handleClickGlobal);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page khi chuyển Tab
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  // Gọi API (chỉ lấy role theo tab)
  const { users, pagination, isLoading, refetch } = useAdminUsers({
    page,
    limit: 10,
    search: debouncedSearch,
    role: activeTab === 'ALL' ? undefined : activeTab
  });

  const { mutate: updateStatus } = useUpdateUserStatus();
  const { mutate: deleteUser } = useDeleteUser();
  const { mutate: resetPassword, isPending: isResetting } = useResetUserPassword();
  const { mutate: createUser, isPending: isCreating } = useCreateUser();

  // Handlers
  const handleStatusToggle = (id, isCurrentlyLocked) => {
    const newStatus = isCurrentlyLocked ? 'ACTIVE' : 'INACTIVE';
    updateStatus({ id, status: newStatus }, { onSuccess: () => { refetch(); setOpenActionId(null); } });
  };

  const handleDelete = (id) => {
    if (window.confirm('CẢNH BÁO: Thao tác này sẽ xóa vĩnh viễn tài khoản. Bạn có chắc chắn?')) {
      deleteUser(id, { onSuccess: () => { refetch(); setOpenActionId(null); } });
    }
  };

  const submitResetPassword = () => {
    if (!newPassword || newPassword.length < 6) return alert('Mật khẩu phải từ 6 ký tự!');
    resetPassword(
      { id: resetModal.userId, newPassword },
      {
        onSuccess: () => {
          setResetModal({ isOpen: false, userId: null, userName: '' });
          setNewPassword('');
          setOpenActionId(null);
        }
      }
    );
  };

  const submitCreateUser = () => {
    if (!newUser.username || !newUser.email || !newUser.password || !newUser.first_name || !newUser.last_name) {
      return alert('Vui lòng điền đầy đủ thông tin bắt buộc (Họ, Tên, Tên đăng nhập, Email, Mật khẩu)!');
    }
    if (newUser.password.length < 6) {
      return alert('Mật khẩu khởi tạo phải từ 6 ký tự!');
    }

    createUser(newUser, {
      onSuccess: () => {
        setCreateModal(false);
        setNewUser({ first_name: '', last_name: '', username: '', email: '', password: '', role: 'MANAGER' });
        refetch();
      }
    });
  };

  // UI Helpers
  const tabs = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'MANAGER', label: 'Quản lý (Manager)' },
    { id: 'ADMIN', label: 'Quản trị viên' }
  ];

  const getRoleBadge = (role) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN': return 'bg-zinc-900 text-white border-zinc-800';
      case 'MANAGER': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-zinc-50 text-zinc-600 border-zinc-200';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-10 font-sans text-zinc-800 animate-in fade-in duration-700">

      {/* HEADER */}
      <div className="mb-10 max-w-7xl mx-auto">
        <span className="inline-flex items-center gap-1.5 py-1 px-3 mb-3 text-[10px] font-bold tracking-[0.3em] text-zinc-600 bg-zinc-200/50 rounded-full border border-zinc-200 uppercase">
          <ShieldCheck className="w-3 h-3" /> Control Panel
        </span>
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 mb-2">Tài Khoản Hệ Thống.</h1>
        <p className="text-zinc-500 text-sm max-w-lg leading-relaxed">
          Quản lý toàn bộ thông tin đăng nhập của nhân viên và khách hàng. Bảo vệ quyền riêng tư tuyệt đối.
        </p>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-[2rem] border border-zinc-100 shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col min-h-[600px]">

        {/* TABS ĐIỀU HƯỚNG */}
        <div className="flex items-center gap-6 px-8 border-b border-zinc-100 bg-zinc-50/30 overflow-x-auto custom-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-5 text-sm font-bold tracking-wide uppercase transition-all whitespace-nowrap border-b-2 ${activeTab === tab.id
                ? 'border-emerald-500 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TOOLBAR */}
        <div className="px-8 py-6 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-5">
          <div className="relative w-full sm:w-[400px] group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm tài khoản..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-11 pr-4 py-3 border border-zinc-200 rounded-2xl bg-zinc-50/50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-medium"
            />
          </div>

          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl text-sm font-bold transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Tạo tài khoản
          </button>
        </div>

        {/* BẢNG DỮ LIỆU */}
        <div className="flex-1 overflow-x-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
              <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Đang đồng bộ...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 bg-white">
                  <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Người dùng</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Định danh</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] text-center">Vai trò</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] text-center">Trạng thái</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] text-center">Bảo mật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 bg-white">
                {users && users.length > 0 ? (
                  users.map((user, index) => {
                    const isLocked = user.deleted_at !== null;
                    const isAdmin = user.role === 'ADMIN';

                    return (
                      <tr key={user._id} className="group hover:bg-zinc-50/80 transition-all duration-300">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 border border-zinc-200/60 shrink-0">
                              <UserIcon className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-zinc-900 text-sm">{user.first_name} {user.last_name}</span>
                              <span className="text-xs text-zinc-500">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 font-mono text-xs text-zinc-500 font-medium">@{user.username}</td>
                        <td className="px-6 py-5 text-center">
                          <span className={`inline-flex px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase border ${getRoleBadge(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase border ${isLocked ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {!isLocked && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                            {isLocked ? 'Đã khóa' : 'Đang hoạt động'}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          {!isAdmin ? (
                            <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setOpenActionId(openActionId === user._id ? null : user._id)}
                                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${openActionId === user._id ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'}`}
                              >
                                <MoreHorizontal className="w-5 h-5" />
                              </button>

                              {openActionId === user._id && (
                                <div className={`absolute right-0 w-48 bg-white border border-zinc-100 rounded-2xl shadow-xl z-50 py-2 text-left animate-in fade-in zoom-in-95 duration-200 ${index >= users.length - 2 && index > 1 ? 'bottom-full mb-2 origin-bottom-right' : 'top-full mt-2 origin-top-right'}`}>
                                  <div className="px-4 py-2 border-b border-zinc-50 mb-1">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Bảo mật</p>
                                  </div>

                                  <button
                                    onClick={() => setResetModal({ isOpen: true, userId: user._id, userName: user.first_name })}
                                    className="w-full px-5 py-2.5 text-xs text-zinc-600 hover:bg-zinc-50 hover:text-emerald-600 flex items-center gap-3 font-bold transition-colors"
                                  >
                                    <KeyRound className="w-4 h-4" /> Cấp lại mật khẩu
                                  </button>

                                  <div className="h-px bg-zinc-100 my-1 mx-3"></div>

                                  <button
                                    onClick={() => handleStatusToggle(user._id, isLocked)}
                                    className={`w-full px-5 py-2.5 text-xs flex items-center gap-3 font-bold transition-colors ${isLocked ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'}`}
                                  >
                                    {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                    {isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                                  </button>
                                  <button
                                    onClick={() => handleDelete(user._id)}
                                    className="w-full px-5 py-2.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-3 font-bold transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" /> Xóa vĩnh viễn
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-zinc-300 italic uppercase">Cấp cao nhất</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-zinc-500 font-medium">
                      <ShieldAlert className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                      Không tìm thấy tài khoản nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION */}
        {!isLoading && pagination && pagination.totalPages > 1 && (
          <div className="bg-white px-8 py-6 border-t border-zinc-100 flex items-center justify-between gap-4">
            <span className="text-zinc-500 text-sm font-medium">
              Trang <span className="font-bold text-zinc-900">{pagination.page}</span> / {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="px-4 py-2 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 transition-all"
              >
                Trước
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 transition-all"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL RESET PASSWORD */}
      {resetModal.isOpen && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 relative">
            <button onClick={() => setResetModal({ isOpen: false, userId: null, userName: '' })} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900">
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-zinc-900 mb-1">Cấp lại mật khẩu</h3>
            <p className="text-sm text-zinc-500 mb-6">Nhập mật khẩu mới cho <span className="font-bold text-zinc-900">{resetModal.userName}</span>.</p>
            <input
              type="text"
              placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 mb-6"
            />
            <button
              onClick={submitResetPassword}
              disabled={isResetting || newPassword.length < 6}
              className="w-full bg-zinc-900 hover:bg-emerald-600 text-white rounded-xl py-3 text-sm font-bold transition-all disabled:opacity-50"
            >
              {isResetting ? 'ĐANG LƯU...' : 'XÁC NHẬN MẬT KHẨU MỚI'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL TẠO TÀI KHOẢN MỚI */}
      {createModal && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 relative">
            <button onClick={() => setCreateModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900">
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mb-4">
              <UserIcon className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-zinc-900 mb-1">Cấp phát tài khoản</h3>
            <p className="text-sm text-zinc-500 mb-6">Tạo mới tài khoản nội bộ và phân quyền truy cập.</p>

            <div className="space-y-4 mb-6">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Họ"
                  value={newUser.last_name}
                  onChange={e => setNewUser({ ...newUser, last_name: e.target.value })}
                  className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
                <input
                  type="text"
                  placeholder="Tên"
                  value={newUser.first_name}
                  onChange={e => setNewUser({ ...newUser, first_name: e.target.value })}
                  className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <input
                type="text"
                placeholder="Tên đăng nhập (Bắt buộc)"
                value={newUser.username}
                onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />

              <input
                type="email"
                placeholder="Email (Bắt buộc)"
                value={newUser.email}
                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />

              <input
                type="text"
                placeholder="Mật khẩu khởi tạo (tối thiểu 6 ký tự)"
                value={newUser.password}
                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />

              <select
                value={newUser.role}
                onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 bg-white"
              >
                <option value="MANAGER">Quản lý (Manager)</option>
              </select>
            </div>

            <button
              onClick={submitCreateUser}
              disabled={isCreating}
              className="w-full bg-zinc-900 hover:bg-emerald-600 text-white rounded-xl py-3 text-sm font-bold transition-all disabled:opacity-50"
            >
              {isCreating ? 'ĐANG TẠO...' : 'XÁC NHẬN TẠO TÀI KHOẢN'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Bổ sung cú pháp export này để đảm bảo App.jsx có thể import mà không bị lỗi
export { UserManagePage };