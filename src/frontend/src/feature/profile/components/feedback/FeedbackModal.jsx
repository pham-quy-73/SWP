import { useEffect, useState } from 'react';
import { profileApi } from '../../api/api';

export default function FeedbackModal({ isOpen, onClose, orderId, productId, existingFeedback, onSuccess }) {
    const [rating, setRating] = useState(existingFeedback?.rating || 0);
    const [comment, setComment] = useState(existingFeedback?.comment || '');
    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState(existingFeedback?.imageUrls || []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setError('');
            setSuccess('');
            setShowDeleteConfirm(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (existingFeedback) {
            setRating(existingFeedback.rating);
            setComment(existingFeedback.comment);
            setImagePreviews(existingFeedback.imageUrls || []);
            setImages([]);
        } else {
            setRating(0);
            setComment('');
            setImagePreviews([]);
            setImages([]);
        }
    }, [existingFeedback]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter(file => file.type.startsWith('image/'));

        setImages(prev => [...prev, ...validFiles]);

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSubmitting(true);

        try {
            const formData = new FormData();

            const feedbackData = {
                rating,
                comment,
                orderId,
                productId
            };
            formData.append('feedback', JSON.stringify(feedbackData));

            images.forEach((image) => {
                formData.append('images', image);
            });

            if (existingFeedback) {
                await profileApi.updateFeedback(existingFeedback.feedbackId, formData);
                setSuccess('Cập nhật đánh giá thành công!');
            } else {
                await profileApi.createFeedback(formData);
                setSuccess('Gửi đánh giá thành công!');
            }

            if (onSuccess) onSuccess();

            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            console.error('Error submitting feedback:', err);
            setError('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!existingFeedback) return;

        setIsSubmitting(true);
        try {
            await profileApi.deleteFeedback(existingFeedback.feedbackId);
            setSuccess('Xóa đánh giá thành công!');

            if (onSuccess) onSuccess();

            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (err) {
            console.error('Error deleting feedback:', err);
            setError('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
            setShowDeleteConfirm(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-sans">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                    <h3 className="text-lg font-bold text-gray-800">
                        {existingFeedback ? 'Cập nhật đánh giá' : 'Đánh giá đơn hàng'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Rating */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3 ml-0.5">
                            Đánh giá của bạn <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="text-3xl transition-transform hover:scale-110 cursor-pointer"
                                >
                                    <svg
                                        className={`w-8 h-8 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                        fill={star <= rating ? 'currentColor' : 'none'}
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                        />
                                    </svg>
                                </button>
                            ))}
                        </div>
                        {rating === 0 && (
                            <p className="text-xs text-rose-500 mt-1 font-semibold">Vui lòng chọn đánh giá</p>
                        )}
                    </div>

                    {/* Comment */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-gray-700 ml-0.5">
                            Bình luận
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            className="w-full px-3.5 py-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-[#4A8795] focus:border-[#4A8795] focus:outline-none resize-none text-sm leading-relaxed"
                            placeholder="Chia sẻ trải nghiệm về chất lượng sản phẩm và dịch vụ của chúng tôi..."
                        />
                    </div>

                    {/* Images */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 ml-0.5">
                            Hình ảnh (không bắt buộc)
                        </label>

                        {/* Image previews */}
                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative group rounded-xl overflow-hidden border">
                                        <img
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-24 object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-rose-500 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer shadow-xs"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Upload button */}
                        <label className="block">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer hover:border-[#4A8795] hover:bg-[#4A8795]/5 transition-colors">
                                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="text-sm font-bold text-gray-700">Tải lên hình ảnh sản phẩm</p>
                                <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF (tối đa 5MB)</p>
                            </div>
                        </label>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                            <p className="text-sm font-bold text-rose-600">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                            <p className="text-sm font-bold text-emerald-600">{success}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        {existingFeedback && (
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={isSubmitting}
                                className="px-4 py-2 border border-rose-300 text-rose-600 rounded-xl hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold text-sm cursor-pointer"
                            >
                                Xóa
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold text-sm cursor-pointer text-center"
                        >
                            Hủy
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting || rating === 0}
                            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider cursor-pointer"
                        >
                            {isSubmitting && (
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {existingFeedback ? 'Cập nhật' : 'Gửi đánh giá'}
                        </button>
                    </div>
                </form>

                {/* Delete Confirmation */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60">
                        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                            <h4 className="text-lg font-bold text-gray-800 mb-2">Xác nhận xóa</h4>
                            <p className="text-sm text-gray-600 mb-6 font-medium">
                                Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold cursor-pointer"
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
