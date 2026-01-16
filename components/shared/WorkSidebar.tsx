import React from 'react';
import { Work } from '../../types';
import { Plus, ChevronRight, Library } from 'lucide-react';

interface WorkSidebarProps {
  works: Work[];
  selectedWorkId: string | null;
  onSelectWork: (workId: string | null) => void;
  onAddWork: () => void;
  onManageWork: () => void;
  itemCounts?: Record<string, number>;
}

export const WorkSidebar: React.FC<WorkSidebarProps> = ({
  works,
  selectedWorkId,
  onSelectWork,
  onAddWork,
  onManageWork,
  itemCounts = {},
}) => {
  return (
    <aside className="hidden md:block w-64 bg-white border-r border-primary-light overflow-y-auto custom-scrollbar flex-shrink-0">
      <div className="p-4 space-y-2">
        {/* All Items */}
        <button
          onClick={() => onSelectWork(null)}
          className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-between group ${
            selectedWorkId === null
              ? 'bg-primary text-gray-800 shadow-md'
              : 'text-gray-500 hover:bg-primary-light hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Library size={18} strokeWidth={2.5} />
            <span>全部作品</span>
          </div>
          {itemCounts['all'] !== undefined && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              selectedWorkId === null
                ? 'bg-white/80 text-gray-700'
                : 'bg-gray-100 text-gray-500 group-hover:bg-primary/30'
            }`}>
              {itemCounts['all']}
            </span>
          )}
        </button>

        {/* Works List */}
        {works.map((work) => (
          <button
            key={work.id}
            onClick={() => onSelectWork(work.id)}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-between group ${
              selectedWorkId === work.id
                ? 'bg-primary text-gray-800 shadow-md'
                : 'text-gray-500 hover:bg-primary-light hover:text-gray-700'
            }`}
          >
            <span className="truncate">{work.name}</span>
            {itemCounts[work.id] !== undefined && (
              <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2 ${
                selectedWorkId === work.id
                  ? 'bg-white/80 text-gray-700'
                  : 'bg-gray-100 text-gray-500 group-hover:bg-primary/30'
              }`}>
                {itemCounts[work.id]}
              </span>
            )}
          </button>
        ))}

        {/* Add Work Button */}
        <button
          onClick={onAddWork}
          className="w-full px-4 py-3 border-2 border-dashed border-primary/30 text-primary-dark rounded-xl hover:bg-primary-light hover:border-primary transition-all font-bold flex items-center justify-center gap-2"
        >
          <Plus size={18} strokeWidth={2.5} />
          新增作品
        </button>

        {/* Manage Work Button */}
        {selectedWorkId && (
          <button
            onClick={onManageWork}
            className="w-full px-4 py-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-all font-bold flex items-center justify-center gap-2"
          >
            管理作品
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </aside>
  );
};
