import React from 'react';
import { RefreshCw, X } from 'lucide-react';

interface UpdatePromptProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

export const UpdatePrompt: React.FC<UpdatePromptProps> = ({ onUpdate, onDismiss }) => {
  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[70] animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-primary p-4 flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center">
          <RefreshCw size={20} className="text-gray-900" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm">發現新版本</p>
          <p className="text-xs text-gray-500 mt-0.5">
            點擊更新以獲取最新功能
          </p>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onDismiss}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            title="稍後提醒"
          >
            <X size={18} />
          </button>
          <button
            onClick={onUpdate}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-gray-900 rounded-lg font-bold text-sm transition-colors shadow-md shadow-primary/20"
          >
            更新
          </button>
        </div>
      </div>
    </div>
  );
};
