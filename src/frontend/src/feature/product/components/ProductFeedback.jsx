import { useState, useEffect, useContext } from 'react';
import { Loader2, Star } from 'lucide-react';
import axios from 'axios';
import FeedbackPreview from '../../profile/components/feedback/FeedbackPreview';
import FeedbackModal from '../../profile/components/feedback/FeedbackModal';
import { AuthContext } from '../../../contexts/AuthContext';

export default function ProductFeedback({ productId }) {
    const { user } = useContext(AuthContext);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    const fetchFeedbacks = async () => {
        if (!productId) return;
        setIsLoading(true);
        setIsError(false);
        try {
            const apiURL = import.meta.env.VITE_API_URL || '';
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.get(`${apiURL}/api/feedbacks/product/${productId}`, { headers });
            
            // Handle different API formats safely
            if (response.data) {
                const data = response.data.result || response.data;
                setFeedbacks(Array.isArray(data) ? data : []);
            } else {
                setFeedbacks([]);
            }
        } catch (error) {
            console.error("Error fetching product feedbacks:", error);
            // Non-critical endpoint error (e.g. backend routes not yet deployed) - fallback gracefully
            setFeedbacks([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedbacks();
    }, [productId]);

    const handleEditFeedback = (feedback) => {
        setSelectedFeedback(feedback);
        setIsEditModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsEditModalOpen(false);
        setSelectedFeedback(null);
    };

    const handleFeedbackSuccess = () => {
        fetchFeedbacks();
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#4A8795]" />
                <p className="text-sm text-gray-500 mt-2">Đang tải đánh giá...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                Không thể tải đánh giá sản phẩm. Vui lòng thử lại sau.
            </div>
        );
    }

    if (!feedbacks || feedbacks.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">Chưa có đánh giá nào cho sản phẩm này</p>
            </div>
        );
    }

    // Calculate average rating
    const averageRating = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / feedbacks.length;
    const ratingCounts = feedbacks.reduce((acc, feedback) => {
        acc[feedback.rating] = (acc[feedback.rating] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="space-y-6 font-sans">
            {/* Rating Summary */}
            <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-base font-bold text-gray-800 mb-4">Đánh giá sản phẩm</h3>

                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    <div className="text-center sm:border-r sm:border-gray-200 sm:pr-8 sm:py-2">
                        <div className="text-3xl font-black text-[#4A8795]">
                            {averageRating.toFixed(1)}
                        </div>
                        <div className="flex items-center justify-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`w-4.5 h-4.5 ${
                                        star <= Math.round(averageRating)
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-gray-300'
                                    }`}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-1 font-bold">{feedbacks.length} đánh giá</p>
                    </div>

                    <div className="flex-1 space-y-2 max-w-md">
                        {[5, 4, 3, 2, 1].map((rating) => (
                            <div key={rating} className="flex items-center gap-3">
                                <span className="text-xs text-gray-600 w-3 font-bold">{rating}</span>
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 shrink-0" />
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="bg-yellow-400 h-full rounded-full transition-all"
                                        style={{
                                            width: `${(ratingCounts[rating] || 0) / feedbacks.length * 100}%`
                                        }}
                                    />
                                </div>
                                <span className="text-xs text-gray-400 w-8 text-right font-bold">
                                    {ratingCounts[rating] || 0}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-800">Tất cả đánh giá</h4>
                {feedbacks.map((feedback) => {
                    const canEdit = user ? feedback?.customerId === user.id : false;

                    return (
                        <div key={feedback.feedbackId} className="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-xs hover:border-gray-300/80 transition-colors">
                            <FeedbackPreview
                                feedback={feedback}
                                onEdit={() => handleEditFeedback(feedback)}
                                showEditButton={canEdit}
                            />
                        </div>
                    );
                })}
            </div>

            <FeedbackModal
                isOpen={isEditModalOpen}
                onClose={handleCloseModal}
                orderId={selectedFeedback?.orderId || ''}
                productId={selectedFeedback?.productId || productId}
                existingFeedback={selectedFeedback}
                onSuccess={handleFeedbackSuccess}
            />
        </div>
    );
}
