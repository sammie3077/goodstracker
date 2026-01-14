import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isDangerous = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border-2 border-white animate-in zoom-in-95">
        <div className="p-6">
          <h3 className="text-lg font-black text-gray-800 mb-3">{title}</h3>
          <div className="text-sm font-medium text-gray-600 mb-6 leading-relaxed">
            {message}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition cursor-pointer"
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-2.5 text-white rounded-xl font-bold shadow-md transition transform active:scale-95 cursor-pointer ${
                isDangerous
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                  : 'bg-primary text-gray-900 hover:bg-primary-dark'
              }`}
            >
              確認刪除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
