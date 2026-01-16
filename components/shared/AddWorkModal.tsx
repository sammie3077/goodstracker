import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AddWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (workName: string) => void;
}

export const AddWorkModal: React.FC<AddWorkModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [workName, setWorkName] = useState('');

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setWorkName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (workName.trim()) {
      onSubmit(workName.trim());
      setWorkName('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-black text-gray-800">新增作品</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            作品名稱 *
          </label>
          <input
            type="text"
            value={workName}
            onChange={(e) => setWorkName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="例如：葬送的芙莉蓮"
            autoFocus
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-200 text-gray-500 rounded-xl hover:bg-white hover:border-gray-300 font-bold transition cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!workName.trim()}
            className="flex-1 py-3 bg-primary text-gray-900 rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/20 font-bold transition transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            新增
          </button>
        </div>
      </div>
    </div>
  );
};
