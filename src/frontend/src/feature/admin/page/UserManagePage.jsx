import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Trash2, Loader2, ShieldCheck, X, CheckCircle, AlertCircle, Edit, Search,
  Lock, Unlock, UserMinus
} from 'lucide-react';

const STAFF_ROLES = [
  { key: 'ADMIN', label: 'Admin', color: 'bg-red-50 text-red-600 hover:bg-red-100' },
  { key: 'MANAGER', label: 'Manager', color: 'bg-orange-50 text-orange-600 hover:bg-orange-100' },
];

const AssignRoleModal = ({ user, onClose, onSuccess }) => {
  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(false);

  const handleAssign = async (role) => {
    setError(null);
    setIsPending(true);
    const toastId = toast.loading('Đang cập nhật vai trò...');
    try {
      const apiURL = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.put(
        `${apiURL}/api/users/${user._id || user.id}/role`,
        { role },
        { headers }
      );

      onSuccess(`Đã cập nhật quyền của ${user.username} thành ${role}!`);
      toast.success('Cập nhật vai trò thành công!', { id: toastId });
      onClose();
    } catch (err) {
      console.error('Failed to assign role:', err);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Cập nhật quyền thất bại. Vui lòng thử lại!';
      setError(message);
      toast.error('Cập nhật vai trò thất bại!', { id: toastId });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Cập nhật vai trò</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Chọn vai trò mới cho <span className="font-semibold text-slate-700">{user.username}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {error && (
          <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-650">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          {STAFF_ROLES.map((roleObj) => (
            <button
              key={roleObj.key}
              onClick={() => handleAssign(roleObj.key)}
              disabled={isPending}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${roleObj.color}`}
            >
              <span>{roleObj.label}</span>
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
            </button>
          ))}

          <div className="my-2 border-t border-slate-100"></div>

          <button
            onClick={() => handleAssign('CUSTOMER')}
            disabled={isPending}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <span>Khách hàng (Customer)</span>
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
          </button>
        </div>

        <button
          onClick={onClose}
          disabled={isPending}
          className="w-full mt-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-55"
        >
          Huỷ
        </button>
      </div>
    </div>
  );
};

const StaffView = ({ activeRole, setActiveRole, usersList, isLoading, assignRole, deleteStaff, isPendingAssign, onToggleStatus, onDeleteUser }) => {
  const [selectedStaff, setSelectedStaff] = useState(null);

  return (
    <div>
      {selectedStaff && (
        <AssignRoleModal
          user={selectedStaff}
          onClose={() => setSelectedStaff(null)}
          onSuccess={(msg) => {
            toast.success(msg);
            assignRole();
          }}
        />
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 px-6 pt-4 border-b border-slate-100 overflow-x-auto">
        {STAFF_ROLES.map((role) => (
          <button
            key={role.key}
            onClick={() => setActiveRole(role.key)}
            className={`px-5 py-2 text-sm font-semibold rounded-t-lg transition-all border-b-2 -mb-px whitespace-nowrap ${
              activeRole === role.key
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {role.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin text-slate-600" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nhân viên</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Vai trò</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    Không có nhân viên nào
                  </td>
                </tr>
              ) : (
                usersList.map((staff) => {
                  const isBlocked = staff.deleted_at !== null && staff.deleted_at !== undefined;
                  return (
                    <tr key={staff._id || staff.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-medium text-slate-900">{staff.username}</td>
                      <td className="px-6 py-4 text-slate-600">{staff.email || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            STAFF_ROLES.find((r) => r.key === activeRole)?.color.replace(/hover:[^\s]+/g, '') ||
                            'bg-slate-50 text-slate-600'
                          }`}
                        >
                          {activeRole}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Bị khóa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-250">
                            Hoạt động
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedStaff(staff)}
                            disabled={isPendingAssign}
                            title="Đổi vai trò"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => deleteStaff(staff)}
                            disabled={isPendingAssign}
                            title="Bãi nhiệm (về Customer)"
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onToggleStatus(staff, isBlocked ? 'ACTIVE' : 'INACTIVE')}
                            disabled={isPendingAssign}
                            title={isBlocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                              isBlocked 
                                ? 'text-emerald-600 hover:bg-emerald-50' 
                                : 'text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            {isBlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => onDeleteUser(staff)}
                            disabled={isPendingAssign}
                            title="Xóa vĩnh viễn tài khoản"
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const CustomerView = ({ usersList, isLoading, assignRole, onToggleStatus, onDeleteUser, isPendingAssign }) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  if (isLoading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <>
      {selectedCustomer && (
        <AssignRoleModal
          user={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onSuccess={(msg) => {
            toast.success(msg);
            assignRole();
          }}
        />
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Khách hàng</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Email</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Trạng thái</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usersList.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                  Không có khách hàng nào
                </td>
              </tr>
            ) : (
              usersList.map((customer) => {
                const isBlocked = customer.deleted_at !== null && customer.deleted_at !== undefined;
                return (
                  <tr key={customer._id || customer.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-900">{customer.username}</td>
                    <td className="px-6 py-4 text-slate-600">{customer.email || 'N/A'}</td>
                    <td className="px-6 py-4">
                      {isBlocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Bị khóa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-250">
                          Hoạt động
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          disabled={isPendingAssign}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Nâng quyền
                        </button>

                        <button
                          onClick={() => onToggleStatus(customer, isBlocked ? 'ACTIVE' : 'INACTIVE')}
                          disabled={isPendingAssign}
                          title={isBlocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                            isBlocked 
                              ? 'text-emerald-600 hover:bg-emerald-50' 
                              : 'text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {isBlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => onDeleteUser(customer)}
                          disabled={isPendingAssign}
                          title="Xóa vĩnh viễn tài khoản"
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default function UserManagePage() {
  const [activeTab, setActiveTab] = useState('staff');
  const [activeRole, setActiveRole] = useState('MANAGER');
  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isPendingAssign, setIsPendingAssign] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const apiURL = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const currentRole = activeTab === 'customer' ? 'CUSTOMER' : activeRole;

      const response = await axios.get(`${apiURL}/api/users`, {
        params: {
          role: currentRole,
          search: search || undefined
        },
        headers
      });

      if (response.data && response.data.result) {
        setUsersList(response.data.result);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Không thể tải danh sách tài khoản');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab, activeRole]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleDemoteToCustomer = async (staff) => {
    if (!window.confirm(`Bạn có chắc muốn bãi nhiệm nhân viên "${staff.username}"?\nHọ sẽ bị thu hồi quyền và chuyển thành Customer.`)) {
      return;
    }

    setIsPendingAssign(true);
    const toastId = toast.loading('Đang thu hồi quyền...');
    try {
      const apiURL = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.put(
        `${apiURL}/api/users/${staff._id || staff.id}/role`,
        { role: 'CUSTOMER' },
        { headers }
      );

      toast.success(`Đã thu hồi quyền của "${staff.username}" thành công!`, { id: toastId });
      fetchUsers();
    } catch (error) {
      console.error('Failed to demote:', error);
      toast.error('Thu hồi quyền thất bại, vui lòng thử lại!', { id: toastId });
    } finally {
      setIsPendingAssign(false);
    }
  };

  const handleToggleStatus = async (user, newStatus) => {
    const actionText = newStatus === 'INACTIVE' ? 'Khóa' : 'Mở khóa';
    if (!window.confirm(`Bạn có chắc muốn ${actionText.toLowerCase()} tài khoản "${user.username}"?`)) {
      return;
    }

    setIsPendingAssign(true);
    const toastId = toast.loading(`Đang ${actionText.toLowerCase()} tài khoản...`);
    try {
      const apiURL = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.put(
        `${apiURL}/api/users/${user._id || user.id}/status`,
        { status: newStatus },
        { headers }
      );

      toast.success(`${actionText} tài khoản thành công!`, { id: toastId });
      fetchUsers();
    } catch (error) {
      console.error('Failed to toggle status:', error);
      toast.error(`${actionText} tài khoản thất bại!`, { id: toastId });
    } finally {
      setIsPendingAssign(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`⚠️ CẢNH BÁO CỰC KỲ QUAN TRỌNG!\n\nBạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản "${user.username}" khỏi hệ thống?\nHành động này không thể hoàn tác!`)) {
      return;
    }

    setIsPendingAssign(true);
    const toastId = toast.loading('Đang xóa tài khoản khỏi DB...');
    try {
      const apiURL = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.delete(
        `${apiURL}/api/users/${user._id || user.id}`,
        { headers }
      );

      toast.success('Xóa tài khoản vĩnh viễn thành công!', { id: toastId });
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Xóa tài khoản thất bại!', { id: toastId });
    } finally {
      setIsPendingAssign(false);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Quản lý người dùng</h1>
          <p className="text-slate-500 mt-1">Quản lý nhân viên và khách hàng</p>
        </div>

        {/* Tìm kiếm */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm tài khoản..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm shadow-sm"
          />
        </form>
      </div>

      {/* Main tabs */}
      <div className="mb-6 flex gap-1 bg-slate-200/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => {
            setActiveTab('staff');
            setActiveRole('MANAGER');
          }}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'staff' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          Nhân viên
        </button>
        <button
          onClick={() => {
            setActiveTab('customer');
          }}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'customer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          Khách hàng
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {activeTab === 'staff' ? (
          <StaffView
            activeRole={activeRole}
            setActiveRole={setActiveRole}
            usersList={usersList}
            isLoading={isLoading}
            assignRole={fetchUsers}
            deleteStaff={handleDemoteToCustomer}
            isPendingAssign={isPendingAssign}
            onToggleStatus={handleToggleStatus}
            onDeleteUser={handleDeleteUser}
          />
        ) : (
          <CustomerView
            usersList={usersList}
            isLoading={isLoading}
            assignRole={fetchUsers}
            onToggleStatus={handleToggleStatus}
            onDeleteUser={handleDeleteUser}
            isPendingAssign={isPendingAssign}
          />
        )}
      </div>
    </div>
  );
}
