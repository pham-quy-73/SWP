import { useContext } from 'react';
import { Edit } from "lucide-react";
import { AuthContext } from '../../../../contexts/AuthContext';

export default function FeedbackPreview({ feedback, onEdit, showEditButton = true }) {
    const { user } = useContext(AuthContext);
    const isOwnFeedback = user ? feedback?.customerId === user.id : false;

    return (
        <div className="space-y-2 bg-gray-50 font-sans">
            {/* Feedback Preview with Edit Button */}
            <div className="rounded-xl p-3.5 relative">
                {/* Feedback Content */}
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-0.5">
                        {isOwnFeedback ? "Đánh giá của bạn" : `Đánh giá của ${feedback.customerName || 'khách hàng'}`}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-semibold">
                            {new Date(feedback.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        {showEditButton && (
                            <button
                                onClick={onEdit}
                                className="flex items-center gap-1.5 px-2.5 py-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 hover:shadow-xs text-xs font-bold"
                                title="Chỉnh sửa đánh giá"
                            >
                                <Edit className="w-3.5 h-3.5" />
                                Chỉnh sửa
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                                key={star}
                                className={`w-4.5 h-4.5 ${star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill={star <= feedback.rating ? 'currentColor' : 'none'}
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
                        ))}
                    </div>
                    <span className="text-xs text-gray-500 font-bold bg-white px-2 py-0.5 border rounded-full">
                        {feedback.rating}/5
                    </span>
                </div>
                {feedback.comment && (
                    <div className="mt-2.5">
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {feedback.comment}
                        </p>
                    </div>
                )}
                {feedback.imageUrls && feedback.imageUrls.length > 0 && (
                    <div className="mt-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-0.5 mb-2">Hình ảnh ({feedback.imageUrls.length})</p>
                        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                            {feedback.imageUrls.slice(0, 4).map((url, index) => (
                                <div key={index} className="flex-shrink-0 relative group rounded-lg overflow-hidden border border-gray-200">
                                    <img
                                        src={url}
                                        alt={`Feedback image ${index + 1}`}
                                        className="w-16 h-16 object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                                        onClick={() => {
                                            window.open(url, '_blank');
                                        }}
                                    />
                                </div>
                            ))}
                            {feedback.imageUrls.length > 4 && (
                                <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex flex-col items-center justify-center font-bold text-gray-600">
                                    <span>+{feedback.imageUrls.length - 4}</span>
                                    <span className="text-[10px] text-gray-400">ảnh</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
