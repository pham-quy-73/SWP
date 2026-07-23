import { useEffect, useState } from 'react';
import { MapPin, Plus, Pencil, Trash2, Star, StarOff, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { profileApi } from '../api/api';

const emptyForm = {
  label: '',
  recipientName: '',
  phoneNumber: '',
  deliveryAddress: '',
  isDefault: false,
};

function AddressFormDialog({ open, onClose, initial, onSubmit, submitting }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(initial || emptyForm);
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.recipientName?.trim() || !form.phoneNumber?.trim() || !form.deliveryAddress?.trim()) {
      toast.error('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ.');
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {initial?._id ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Nhãn (ví dụ: Nhà, Công ty)</label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full h-11 px-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4A8795] focus:ring-1 focus:ring-[#4A8795]/20"
              placeholder="Nhà"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Họ và tên người nhận <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.recipientName}
              onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
              className="w-full h-11 px-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4A8795] focus:ring-1 focus:ring-[#4A8795]/20"
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              className="w-full h-11 px-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4A8795] focus:ring-1 focus:ring-[#4A8795]/20"
              placeholder="0912 345 678"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Địa chỉ giao hàng <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={form.deliveryAddress}
              onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4A8795] focus:ring-1 focus:ring-[#4A8795]/20 resize-none"
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-[#4A8795] focus:ring-[#4A8795]"
            />
            <span className="text-sm text-gray-700 font-medium">Đặt làm địa chỉ mặc định</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-[#4A8795] text-white text-sm font-semibold hover:bg-[#3a6b76] disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {initial?._id ? 'Lưu thay đổi' : 'Thêm địa chỉ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MyAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const list = await profileApi.getAddresses();
      setAddresses(list);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (addr) => {
    setEditing({
      _id: addr._id,
      label: addr.label || '',
      recipientName: addr.recipient_name,
      phoneNumber: addr.phone_number,
      deliveryAddress: addr.delivery_address,
      isDefault: addr.is_default,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (form) => {
    setSubmitting(true);
    try {
      if (editing?._id) {
        await profileApi.updateAddress(editing._id, form);
        toast.success('Đã cập nhật địa chỉ');
      } else {
        await profileApi.createAddress(form);
        toast.success('Đã thêm địa chỉ mới');
      }
      setDialogOpen(false);
      await loadAddresses();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Không thể lưu địa chỉ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await profileApi.setDefaultAddress(id);
      toast.success('Đã đặt làm mặc định');
      await loadAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể đặt mặc định');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa địa chỉ này khỏi sổ địa chỉ?')) return;
    try {
      await profileApi.deleteAddress(id);
      toast.success('Đã xóa địa chỉ');
      await loadAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa địa chỉ');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#4A8795]" /> Sổ địa chỉ
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Lưu địa chỉ để thanh toán nhanh hơn ở các lần mua tiếp theo.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#4A8795] text-white text-sm font-semibold hover:bg-[#3a6b76] shrink-0"
        >
          <Plus className="w-4 h-4" /> Thêm địa chỉ
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#4A8795]" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="p-8 text-center text-gray-500 border border-dashed rounded-xl">
          <MapPin className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p>Bạn chưa lưu địa chỉ nào. Thêm địa chỉ đầu tiên để thanh toán nhanh hơn.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr._id}
              className={`border rounded-xl p-4 transition-colors ${
                addr.is_default ? 'border-[#4A8795] bg-[#4A8795]/5' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900">{addr.recipient_name}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-700">{addr.phone_number}</span>
                    {addr.label && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium">
                        {addr.label}
                      </span>
                    )}
                    {addr.is_default && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-[#4A8795] text-white font-bold flex items-center gap-1">
                        <Star className="w-3 h-3" /> Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1.5">{addr.delivery_address}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefault(addr._id)}
                      title="Đặt làm mặc định"
                      className="p-2 text-gray-500 hover:text-[#4A8795] hover:bg-[#4A8795]/10 rounded-lg"
                    >
                      <StarOff className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(addr)}
                    title="Chỉnh sửa"
                    className="p-2 text-gray-500 hover:text-[#4A8795] hover:bg-[#4A8795]/10 rounded-lg"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(addr._id)}
                    title="Xóa"
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddressFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initial={editing}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
}
