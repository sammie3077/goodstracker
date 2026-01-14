import React, { useState } from 'react';
import { Work, Category } from '../../types';
import { Settings, X, Edit2, Trash2, Check, AlertTriangle, GripVertical } from 'lucide-react';

interface WorkManagerProps {
  isOpen: boolean;
  currentWork: Work | null;
  sortedCategories: Category[];
  categoriesDragHandlers: any;
  onClose: () => void;
  onUpdateWorkName: (name: string) => void;
  onDeleteWork: () => void;
  onAddCategory: (name: string) => void;
  onUpdateCategory: (catId: string, name: string) => void;
  onDeleteCategory: (catId: string, name: string) => void;
}

export const WorkManager: React.FC<WorkManagerProps> = ({
  isOpen,
  currentWork,
  sortedCategories,
  categoriesDragHandlers,
  onClose,
  onUpdateWorkName,
  onDeleteWork,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [managerTab, setManagerTab] = useState<'work' | 'categories'>('categories');
  const [editWorkName, setEditWorkName] = useState(currentWork?.name || '');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  if (!isOpen || !currentWork) return null;

  const handleUpdateWorkName = () => {
    if (editWorkName.trim()) {
      onUpdateWorkName(editWorkName);
    }
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName);
      setNewCategoryName('');
    }
  };

  const handleUpdateCategory = (catId: string) => {
    if (editingCatName.trim()) {
      onUpdateCategory(catId, editingCatName);
      setEditingCatId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl border-4 border-white flex flex-col max-h-[85vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-primary-light/30">
          <h3 className="font-black text-lg text-gray-700 flex items-center gap-2">
            <Settings size={20} className="text-gray-400" />
            管理：{currentWork.name}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 flex items-center justify-center transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setManagerTab('categories')}
            className={`flex-1 py-3 font-bold text-sm transition-colors ${managerTab === 'categories' ? 'text-primary-dark border-b-2 border-primary bg-primary/5' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            分類管理
          </button>
          <button
            onClick={() => setManagerTab('work')}
            className={`flex-1 py-3 font-bold text-sm transition-colors ${managerTab === 'work' ? 'text-primary-dark border-b-2 border-primary bg-primary/5' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            作品設定
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {managerTab === 'categories' ? (
            <div className="space-y-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  placeholder="新增分類 (例如: 拍立得)"
                  className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-2 focus:border-primary focus:outline-none bg-white text-gray-900 font-medium text-sm"
                />
                <button onClick={handleAddCategory} disabled={!newCategoryName.trim()} className="bg-gray-800 text-white px-4 rounded-xl font-bold text-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                  新增
                </button>
              </div>

              <div className="space-y-2">
                {sortedCategories.map(cat => (
                  <div
                    key={cat.id}
                    className={`flex items-center gap-2 p-3 bg-white border border-gray-100 rounded-xl hover:border-primary-light transition-colors group ${
                      categoriesDragHandlers.draggedId === cat.id
                        ? 'opacity-50 bg-gray-100'
                        : categoriesDragHandlers.dragOverId === cat.id
                          ? 'border-secondary bg-secondary/10'
                          : ''
                    }`}
                    data-draggable-id={cat.id}
                    draggable
                    {...categoriesDragHandlers.handlers}
                    onDragStart={(e) => categoriesDragHandlers.handlers.onDragStart(e, cat.id)}
                    onDragOver={(e) => categoriesDragHandlers.handlers.onDragOver(e, cat.id)}
                    onDrop={(e) => categoriesDragHandlers.handlers.onDrop(e, cat.id)}
                    onTouchStart={(e) => categoriesDragHandlers.handlers.onTouchStart(e, cat.id)}
                  >
                    <GripVertical size={16} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    {editingCatId === cat.id ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          autoFocus
                          type="text"
                          value={editingCatName}
                          onChange={e => setEditingCatName(e.target.value)}
                          className="flex-1 border-b-2 border-primary focus:outline-none font-bold text-gray-900 bg-transparent px-1"
                        />
                        <button onClick={() => handleUpdateCategory(cat.id)} className="text-green-500 hover:bg-green-50 p-1 rounded">
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditingCatId(null)} className="text-gray-400 hover:bg-gray-50 p-1 rounded">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 font-bold text-gray-600 px-1">{cat.name}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }}
                            className="p-2 text-gray-400 hover:text-primary-dark hover:bg-primary-light rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 size={16} className="pointer-events-none" />
                          </button>
                          <button
                            onClick={() => onDeleteCategory(cat.id, cat.name)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={16} className="pointer-events-none" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {sortedCategories.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-4">目前沒有分類</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">修改作品名稱</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={editWorkName}
                    onChange={e => setEditWorkName(e.target.value)}
                    className="flex-1 border-2 border-gray-100 rounded-xl p-3 focus:border-primary focus:outline-none font-medium text-gray-900 bg-white"
                  />
                  <button onClick={handleUpdateWorkName} className="bg-primary text-gray-900 px-5 rounded-xl font-bold shadow-md shadow-primary/20 hover:bg-primary-dark cursor-pointer">
                    儲存
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-dashed border-gray-200">
                <h4 className="font-bold text-red-500 flex items-center gap-2 mb-3">
                  <AlertTriangle size={18} /> 危險區域
                </h4>
                <p className="text-xs text-gray-500 mb-4">
                  刪除此作品將會<span className="font-bold text-red-500">永久刪除</span>該作品底下的所有分類與周邊商品資料。此動作無法復原。
                </p>
                <button
                  onClick={onDeleteWork}
                  className="w-full py-3 border-2 border-red-100 text-red-500 bg-red-50/50 rounded-xl font-bold hover:bg-red-100 hover:border-red-200 transition-colors cursor-pointer"
                >
                  刪除整個作品
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
