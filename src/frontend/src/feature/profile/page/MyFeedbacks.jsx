import { useState, useEffect } from 'react';
import { Star, MessageSquare, Loader2, RefreshCw, Trash2, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { profileApi } from '../api/api';
import FeedbackModal from '../components/feedback/FeedbackModal';

export default function MyFeedbacks() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State cho Modal edit
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchFeedbacks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await profileApi.getMyFeedbacks();
      setFeedbacks(res.data?.result || res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách đánh giá:', err);
      setError('Không thể tải danh sách đánh giá của bạn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleEdit = (fb) => {
    setEditingFeedback(fb);
    setModalOpen(true);
  };

  const handleDelete = async (feedbackId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return;
    try {
      await profileApi.deleteFeedback(feedbackId);
      toast.success('Đã xóa đánh giá');
      fetchFeedbacks();
    } catch (err) {
      toast.error('Xóa đánh giá thất bại');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6 font-sans animate-in fade-in duration-500 min-h-[450px]">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> Đánh giá của tôi
          </h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            Quản lý các phản hồi và đánh giá bạn đã gửi cho các sản phẩm
          </p>
        </div>
        <button
          onClick={fetchFeedbacks}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
          title="Làm mới"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1e2575]" />
        </div>
      ) : error ? (
        <div className="p-8 text-center border border-rose-100 bg-rose-50/50 rounded-2xl">
          <p className="text-sm font-bold text-rose-600">{error}</p>
          <button
            onClick={fetchFeedbacks}
            className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-gray-700 text-base">Chưa có đánh giá nào</h3>
          <p className="text-xs text-gray-400 font-medium max-w-sm mx-auto">
            Sau khi hoàn thành đơn hàng, bạn có thể gửi đánh giá cho các sản phẩm đã mua tại trang Đơn hàng của tôi.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((fb) => (
            <div
              key={fb._id || fb.feedbackId}
              className="p-5 border border-gray-100 bg-gray-50/40 rounded-2xl hover:border-gray-200 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">
                    {fb.product_id?.name || fb.productName || 'Sản phẩm đã đánh giá'}
                  </h4>
                  <p className="text-[11px] text-gray-400 font-semibold mt-0.5">
                    {new Date(fb.createdAt || fb.created_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(fb)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="Chỉnh sửa"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa
                  </button>
                  <button
                    onClick={() => handleDelete(fb._id || fb.feedbackId)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="Xóa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Rating stars */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= fb.rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-200 fill-gray-200'
                    }`}
                  />
                ))}
                <span className="text-xs font-bold text-gray-500 ml-1.5">{fb.rating}/5</span>
              </div>

              {/* Comment */}
              {fb.comment && (
                <p className="text-sm text-gray-600 leading-relaxed font-medium bg-white p-3 rounded-xl border border-gray-100">
                  {fb.comment}
                </p>
              )}

              {/* Images */}
              {(fb.images || fb.imageUrls || []).length > 0 && (
                <div className="flex gap-2 pt-1 overflow-x-auto">
                  {(fb.images || fb.imageUrls || []).map((imgUrl, idx) => (
                    <img
                      key={idx}
                      src={imgUrl}
                      alt={`Evaluation img ${idx}`}
                      className="w-16 h-16 object-cover rounded-xl border border-gray-200 shrink-0 cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => window.open(imgUrl, '_blank')}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {modalOpen && (
        <FeedbackModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          orderId={editingFeedback?.orderId || editingFeedback?.order_id}
          productId={editingFeedback?.productId || editingFeedback?.product_id?._id}
          existingFeedback={editingFeedback}
          onSuccess={() => {
            fetchFeedbacks();
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
