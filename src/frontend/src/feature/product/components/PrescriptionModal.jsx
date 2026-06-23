import { useState, useRef } from 'react';
import { usePrescriptionStore } from '../store/usePrescriptionStore';
import { Trash2, Keyboard, Image as ImageIcon, Camera } from 'lucide-react';

export default function PrescriptionWidget() {
  const { updatePrescription, prescription } = usePrescriptionStore();
  const [activeTab, setActiveTab] = useState('image');
  const [activeEye, setActiveEye] = useState('od');
  const fileInputRef = useRef(null);

  const updateEyeData = (eye, field, value) => {
    const newEyeData = { ...prescription[eye], [field]: value };
    updatePrescription({
      [eye]: newEyeData,
    });
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const base64Image = await convertFileToBase64(file);
        updatePrescription({ imageUrl: base64Image });
      } catch (error) {
        console.error('Lỗi khi đọc file ảnh:', error);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderMiniInput = (val, onChange) => (
    <input
      type="text"
      value={val}
      onChange={(e) => onChange(e.target.value)}
      className="text-center font-bold text-gray-800 h-8 text-xs bg-white border border-gray-200 focus:border-[#4A8795] focus:outline-none rounded px-0 w-full"
      placeholder="0.00"
    />
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-300">
      {/* 1. HEADER */}
      <div className="bg-gray-50/50 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
          Thông tin độ cận
        </span>
        <div className="flex bg-gray-200/50 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`p-1.5 rounded-md transition-all ${activeTab === 'image' ? 'bg-white text-[#4A8795] shadow-sm' : 'text-gray-400'}`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`p-1.5 rounded-md transition-all ${activeTab === 'manual' ? 'bg-white text-[#4A8795] shadow-sm' : 'text-gray-400'}`}
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. BODY */}
      <div className="p-4">
        {activeTab === 'image' ? (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <div
              onClick={() => !prescription.imageUrl && fileInputRef.current?.click()}
              className={`relative rounded-lg border-2 border-dashed h-32 flex flex-col items-center justify-center cursor-pointer transition-colors
                    ${prescription.imageUrl ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-50 hover:border-[#4A8795]'}`}
            >
              {prescription.imageUrl ? (
                <>
                  <img
                    src={prescription.imageUrl}
                    className="h-full w-full object-contain p-1 rounded"
                    alt="Prescription"
                  />
                  <div className="absolute top-1 right-1">
                    <button
                      type="button"
                      className="h-6 w-6 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        updatePrescription({ imageUrl: null });
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-1 text-center">
                  <Camera className="w-5 h-5 text-gray-400 mx-auto" />
                  <span className="text-[10px] font-semibold text-gray-500 block">
                    Tải ảnh đơn kính
                  </span>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            {/* OD/OS Switch */}
            <div className="flex justify-center mb-3">
              <div className="flex bg-gray-100 p-1 rounded-full w-full max-w-[200px]">
                <button
                  type="button"
                  onClick={() => setActiveEye('od')}
                  className={`flex-1 text-[10px] font-bold py-1 rounded-full transition-all ${activeEye === 'od' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                >
                  OD (Mắt phải)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEye('os')}
                  className={`flex-1 text-[10px] font-bold py-1 rounded-full transition-all ${activeEye === 'os' ? 'bg-white text-[#4A8795] shadow-sm' : 'text-gray-400'}`}
                >
                  OS (Mắt trái)
                </button>
              </div>
            </div>

            <div
              className={`p-2.5 rounded-lg border transition-all ${activeEye === 'od' ? 'bg-gray-50 border-gray-100' : 'bg-[#4A8795]/5 border-[#4A8795]/20'}`}
            >
              <div className="grid grid-cols-5 gap-1 mb-1 text-center">
                {['SPH', 'CYL', 'AX', 'ADD', 'PD'].map((l) => (
                  <label key={l} className="text-[9px] font-bold text-gray-400">
                    {l}
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {['sphere', 'cylinder', 'axis', 'add', 'pd'].map((field) =>
                  renderMiniInput(prescription[activeEye][field], (v) =>
                    updateEyeData(activeEye, field, v)
                  )
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-3">
          <textarea
            placeholder="Ghi chú thêm cho kỹ thuật viên..."
            value={prescription.notes}
            onChange={(e) => updatePrescription({ notes: e.target.value })}
            className="w-full p-2.5 bg-white text-xs min-h-[50px] resize-none focus:outline-none focus:border-[#4A8795] border border-gray-200 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
