
import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storageService';
import { GalleryItem, Work, GallerySpec } from '../types';
import { Plus, Filter, Trash2, X, Settings, Edit2, Book, Check, AlertTriangle, Grid, Layers, Library, Sparkle, Loader2, Search } from 'lucide-react';
import { ImageCropper } from './ImageCropper';

export const GalleryList: React.FC = () => {
  // Data State
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI State
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  
  // Confirm Dialog State
  const [confirmConfig, setConfirmConfig] = useState<{
      isOpen: boolean;
      title: string;
      message: React.ReactNode;
      onConfirm: () => void;
      isDangerous?: boolean;
  } | null>(null);

  // Modals
  const [isAddWorkOpen, setIsAddWorkOpen] = useState(false);
  const [newWorkName, setNewWorkName] = useState('');
  
  // Work Manager Modal State
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [editWorkName, setEditWorkName] = useState('');

  // Batch Add Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Item Form State
  const [formData, setFormData] = useState<Partial<GalleryItem>>({});
  const [formSpecs, setFormSpecs] = useState<GallerySpec[]>([]);
  const [batchCount, setBatchCount] = useState<number>(10);
  const [isSpecEditMode, setIsSpecEditMode] = useState(false);
  
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    const [fetchedItems, fetchedWorks] = await Promise.all([
        StorageService.getGalleryItems(),
        StorageService.getWorks()
    ]);
    setItems(fetchedItems);
    setWorks(fetchedWorks);
    setIsLoading(false);
  };

  // --- Computed ---
  const filteredItems = useMemo(() => {
    let result = items;
    // 1. Filter by Work
    if (selectedWorkId) {
      result = result.filter(i => i.workId === selectedWorkId);
    }
    // 2. Filter by Search Query
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        result = result.filter(i => 
            i.name.toLowerCase().includes(query) || 
            (i.originalName && i.originalName.toLowerCase().includes(query))
        );
    }

    // Sort by newest first
    return result.sort((a, b) => b.createdAt - a.createdAt);
  }, [items, selectedWorkId, searchQuery]);

  const currentWork = works.find(w => w.id === selectedWorkId);

  // --- Handlers ---

  const handleCreateWork = async () => {
    if (newWorkName.trim()) {
      const work = await StorageService.addWork(newWorkName);
      setSelectedWorkId(work.id);
      setNewWorkName('');
      setIsAddWorkOpen(false);
      refreshData();
    }
  };

  // Manager Modal Handlers
  const openManager = () => {
    if (currentWork) {
      setEditWorkName(currentWork.name);
      setIsManagerOpen(true);
    }
  };

  const handleUpdateWorkName = async () => {
    if (selectedWorkId && editWorkName.trim()) {
      await StorageService.updateWork(selectedWorkId, editWorkName);
      refreshData();
      alert('作品名稱已更新');
    }
  };

  const handleDeleteWork = () => {
    if (!selectedWorkId || !currentWork) return;
    
    setConfirmConfig({
        isOpen: true,
        title: '⚠️ 危險動作',
        message: (
            <span>
                確定要刪除作品「<span className="font-bold text-gray-900">{currentWork.name}</span>」嗎？<br/><br/>
                <span className="text-red-500 font-bold">注意：該作品底下的【所有周邊與圖鑑】也會一併被刪除！</span><br/>
                此動作無法復原。
            </span>
        ),
        isDangerous: true,
        onConfirm: async () => {
            try {
                await StorageService.deleteWork(selectedWorkId);
                setSelectedWorkId(null);
                setIsManagerOpen(false);
                refreshData();
            } catch (e) {
                alert('刪除失敗');
                console.error(e);
            }
            setConfirmConfig(null);
        }
    });
  };

  const openForm = (item?: GalleryItem) => {
    setBatchCount(10); // Reset batch count default
    setIsSpecEditMode(false); // Default to collection mode
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
      setFormSpecs(JSON.parse(JSON.stringify(item.specs || []))); // Deep copy to avoid mutating directly
    } else {
      setEditingItem(null);
      setFormData({
        workId: selectedWorkId || (works.length > 0 ? works[0].id : ''),
        createdAt: Date.now(),
        image: ''
      });
      setFormSpecs([]);
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.workId) {
      alert('請填寫完整資訊');
      return;
    }

    const payload = {
      ...formData,
      id: editingItem?.id || crypto.randomUUID(),
      specs: formSpecs,
    } as GalleryItem;

    try {
        if (editingItem) {
          await StorageService.updateGalleryItem(payload);
        } else {
          await StorageService.addGalleryItem(payload);
        }
        setIsFormOpen(false);
        refreshData();
    } catch (error) {
        console.error(error);
        alert('儲存失敗！');
    }
  };

  const handleDeleteItem = (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      e?.preventDefault();
      
      setConfirmConfig({
          isOpen: true,
          title: '刪除圖鑑',
          message: '確定要刪除這個圖鑑項目嗎？此動作無法復原。',
          isDangerous: true,
          onConfirm: async () => {
              await StorageService.deleteGalleryItem(id);
              if (editingItem?.id === id) {
                  setIsFormOpen(false);
                  setEditingItem(null);
              }
              refreshData();
              setConfirmConfig(null);
          }
      });
  };

  // --- Spec Handlers ---
  
  const handleAddSpec = () => {
      setFormSpecs([...formSpecs, { id: crypto.randomUUID(), name: `規格 ${formSpecs.length + 1}`, isOwned: false }]);
  };

  const handleOpenBatchModal = () => {
      setBatchCount(10);
      setIsBatchModalOpen(true);
  };

  const handleConfirmBatchAdd = () => {
      const newSpecs: GallerySpec[] = [];
      const startNum = formSpecs.length;
      for (let i = 1; i <= batchCount; i++) {
          newSpecs.push({
              id: crypto.randomUUID(),
              name: `${startNum + i}`, // Continue numbering from current count
              isOwned: false
          });
      }
      setFormSpecs([...formSpecs, ...newSpecs]);
      setIsBatchModalOpen(false);
  };

  const toggleSpecOwned = (specId: string) => {
      setFormSpecs(formSpecs.map(s => s.id === specId ? { ...s, isOwned: !s.isOwned } : s));
  };

  const updateSpecName = (specId: string, name: string) => {
      setFormSpecs(formSpecs.map(s => s.id === specId ? { ...s, name } : s));
  };

  const deleteSpec = (specId: string) => {
      setFormSpecs(formSpecs.filter(s => s.id !== specId));
  };

  if (isLoading && items.length === 0) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    // Fixed height container for App-like layout (Viewport - Nav Height)
    <div className="flex flex-col md:flex-row h-[calc(100dvh-4rem)] md:h-[calc(100vh-5rem)] overflow-hidden bg-background transition-colors duration-500">
      {/* Sidebar: Works */}
      <aside className="hidden md:block w-64 bg-white/60 backdrop-blur-sm border-r border-primary-light flex-shrink-0 h-full overflow-y-auto custom-scrollbar">
        <div className="p-4 border-b border-primary-light flex justify-between items-center bg-primary-light/30 sticky top-0 z-10 backdrop-blur-md">
          <h2 className="font-bold text-gray-700 flex items-center gap-2">
            <Library size={20} className="text-gray-600" /> 作品列表
          </h2>
          <button onClick={() => setIsAddWorkOpen(true)} className="p-1.5 hover:bg-white bg-white/50 text-gray-600 rounded-full shadow-sm transition-all hover:scale-105 hover:text-primary-dark cursor-pointer">
            <Plus size={18} className="pointer-events-none" />
          </button>
        </div>
        <div className="py-2 space-y-0.5">
          <button
            onClick={() => { setSelectedWorkId(null); }}
            className={`w-full text-left px-5 py-3 text-sm transition font-bold border-l-4 hover:bg-primary-light/50 ${!selectedWorkId ? 'border-primary bg-primary-light/50 text-gray-900' : 'border-transparent text-gray-500'}`}
          >
            全部作品
          </button>
          {works.map(work => (
            <div key={work.id} className="relative group">
                <button
                  onClick={() => { setSelectedWorkId(work.id); }}
                  className={`w-full text-left px-5 py-3 text-sm transition font-bold truncate border-l-4 hover:bg-primary-light/50 ${selectedWorkId === work.id ? 'border-primary bg-primary-light/50 text-gray-900' : 'border-transparent text-gray-500'}`}
                >
                  {work.name}
                </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full max-w-[100vw] h-full overflow-hidden relative">
        {/* Top Filter Bar */}
        <header className="bg-background p-4 border-b border-primary-light flex flex-col gap-4 z-30 shadow-sm flex-shrink-0 transition-colors duration-500">
            {/* Mobile Work Selector */}
            <div className="md:hidden flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar border-b border-primary-light/50">
                 <button onClick={() => setIsAddWorkOpen(true)} className="flex-shrink-0 p-2 bg-primary-light text-primary-dark rounded-full shadow-sm cursor-pointer">
                    <Plus size={16} className="pointer-events-none" />
                 </button>
                 <button 
                    onClick={() => { setSelectedWorkId(null); }}
                    className={`whitespace-nowrap px-2 py-2 text-sm font-bold transition border-b-2 ${!selectedWorkId ? 'border-primary text-gray-900' : 'border-transparent text-gray-500'}`}
                 >
                    全部作品
                 </button>
                 {works.map(w => (
                     <button
                        key={w.id}
                        onClick={() => { setSelectedWorkId(w.id); }}
                        className={`whitespace-nowrap px-2 py-2 text-sm font-bold transition border-b-2 ${selectedWorkId === w.id ? 'border-primary text-gray-900' : 'border-transparent text-gray-500'}`}
                     >
                        {w.name}
                     </button>
                 ))}
            </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
             {/* Header Title / Actions */}
             <div className="flex items-center gap-2 w-full md:w-auto">
                {selectedWorkId && currentWork ? (
                  <>
                    <button 
                        onClick={openManager}
                        className="flex-shrink-0 p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full mr-2 transition-colors cursor-pointer"
                        title="管理作品"
                    >
                        <Settings size={18} className="pointer-events-none" />
                    </button>
                    <h2 className="text-xl font-black text-gray-800">{currentWork.name} - 圖鑑</h2>
                  </>
                ) : (
                    <div className="text-lg font-black text-gray-800 tracking-tight flex items-center gap-2 mr-2">
                        <Book size={20} className="text-secondary-dark" /> 全部圖鑑
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
                {/* Search Bar */}
                <div className="relative flex-1 md:w-64 max-w-sm">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="搜尋圖鑑..."
                        className="w-full pl-9 pr-4 py-2 bg-white border-2 border-primary-light rounded-full text-xs md:text-sm focus:outline-none focus:border-primary text-gray-800 shadow-sm"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4 pointer-events-none" />
                     {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                            <X size={14} />
                        </button>
                    )}
                </div>
                
                <div className="ml-2 flex items-center gap-2">
                    <button 
                        onClick={() => openForm()} 
                        className="bg-primary hover:bg-primary-dark text-gray-900 px-4 py-2 rounded-full flex items-center gap-2 text-sm shadow-md shadow-primary/30 transition-all hover:-translate-y-0.5 cursor-pointer"
                    >
                        <Plus size={18} strokeWidth={3} className="pointer-events-none" /> 
                        <span className="hidden sm:inline font-bold pointer-events-none">新增圖鑑</span>
                        <span className="sm:hidden font-bold pointer-events-none">新增</span>
                    </button>
                </div>
             </div>
          </div>
        </header>

        {/* Grid Content */}
        <div className="p-2 md:p-6 flex-1 overflow-y-auto custom-scrollbar pb-24 md:pb-6">
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-5">
                {filteredItems.map(item => {
                    const totalSpecs = item.specs?.length || 0;
                    const ownedSpecs = item.specs?.filter(s => s.isOwned).length || 0;
                    const percent = totalSpecs > 0 ? Math.round((ownedSpecs / totalSpecs) * 100) : 0;
                    
                    return (
                        <div 
                            key={item.id} 
                            onClick={() => openForm(item)}
                            className="bg-white rounded-xl md:rounded-3xl shadow-sm border border-primary-light overflow-hidden hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group flex flex-col hover:-translate-y-1 cursor-pointer relative"
                        >
                            <div className="relative aspect-square bg-gray-50 overflow-hidden m-1 md:m-2 rounded-lg md:rounded-2xl">
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 z-0" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                                        <Book size={24} />
                                    </div>
                                )}
                                
                                {/* Progress Badge */}
                                <div className="absolute top-1 right-1 md:top-2 md:right-2 z-10">
                                    <span className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded-md text-[9px] md:text-xs font-bold border shadow-sm backdrop-blur-md bg-white/95 flex items-center gap-1 ${percent === 100 ? 'text-secondary-dark border-secondary/30' : 'text-gray-600 border-gray-100'}`}>
                                        {percent === 100 && <Check size={10} strokeWidth={4} className="text-secondary-dark" />}
                                        {ownedSpecs}/{totalSpecs}
                                    </span>
                                </div>

                                {/* Hover Edit/Delete Overlay */}
                                <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-[1px] opacity-0 md:group-hover:opacity-100 transition-opacity flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 z-20 pointer-events-none md:pointer-events-auto">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); openForm(item); }} 
                                        className="bg-white text-gray-700 p-1.5 md:px-5 md:py-2 rounded-full text-xs font-bold shadow-lg hover:scale-110 transition-transform pointer-events-auto cursor-pointer"
                                    >
                                        <Edit2 size={14} className="pointer-events-none"/>
                                    </button>
                                    <button 
                                        onClick={(e) => handleDeleteItem(item.id, e)} 
                                        className="bg-white text-red-400 p-1.5 md:px-5 md:py-2 rounded-full text-xs font-bold shadow-lg hover:scale-110 transition-transform pointer-events-auto cursor-pointer"
                                    >
                                        <Trash2 size={14} className="pointer-events-none"/>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="px-2 md:px-5 pb-2 md:pb-4 pt-0.5 md:pt-1 flex flex-col flex-1">
                                <h3 className="font-bold text-gray-800 text-[11px] md:text-lg mb-1 md:mb-2 truncate leading-tight">{item.name}</h3>
                                
                                {/* Progress Bar */}
                                <div className="mt-auto">
                                    <div className="w-full h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-secondary transition-all duration-500 ease-out rounded-full"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                         <span className="text-[9px] md:text-xs text-gray-400 font-bold">{percent}% 收集</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {filteredItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <div className="bg-white p-6 rounded-full mb-4 shadow-sm border border-primary-light">
                        {searchQuery ? <Search size={48} className="text-primary-light" /> : <Book size={48} className="text-primary-light" />}
                    </div>
                    <p className="font-medium">{searchQuery ? '找不到符合搜尋的圖鑑' : '沒有圖鑑資料'}</p>
                    <button onClick={() => openForm()} className="mt-4 text-gray-600 bg-primary/20 px-4 py-2 rounded-full text-sm font-bold hover:bg-primary/40 transition">新增第一筆圖鑑？</button>
                </div>
            )}
        </div>
      </main>

      {/* --- Modals (Unchanged) --- */}
      
      {/* 1. Add Work Modal */}
      {isAddWorkOpen && (
          <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl border-4 border-white">
                  <h3 className="text-xl font-bold mb-6 text-center text-gray-800">新增作品分類</h3>
                  <input 
                    autoFocus
                    type="text" 
                    value={newWorkName} 
                    onChange={e => setNewWorkName(e.target.value)} 
                    className="w-full border-2 border-gray-100 rounded-xl p-3 mb-6 focus:border-primary focus:outline-none text-center font-medium bg-white text-gray-900 placeholder-gray-400" 
                    placeholder="作品名稱 (例如: 排球少年)"
                  />
                  <div className="flex gap-3">
                      <button onClick={() => setIsAddWorkOpen(false)} className="flex-1 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition">取消</button>
                      <button onClick={handleCreateWork} className="flex-1 py-3 bg-primary text-gray-900 rounded-xl hover:bg-primary-dark font-bold shadow-lg shadow-primary/30 transition">建立</button>
                  </div>
              </div>
          </div>
      )}

      {/* 2. Manager Modal (Works only, no categories for gallery) */}
      {isManagerOpen && currentWork && (
          <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl border-4 border-white flex flex-col">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-primary-light/30">
                      <h3 className="font-black text-lg text-gray-700 flex items-center gap-2">
                        <Settings size={20} className="text-gray-400" />
                        管理：{currentWork.name}
                      </h3>
                      <button onClick={() => setIsManagerOpen(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 flex items-center justify-center transition-colors">
                          <X size={20} />
                      </button>
                  </div>

                  <div className="p-6 space-y-8">
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
                              刪除此作品將會<span className="font-bold text-red-500">永久刪除</span>該作品底下的所有周邊與圖鑑資料。
                          </p>
                          <button 
                            onClick={handleDeleteWork}
                            className="w-full py-3 border-2 border-red-100 text-red-500 bg-red-50/50 rounded-xl font-bold hover:bg-red-100 hover:border-red-200 transition-colors cursor-pointer"
                          >
                              刪除整個作品
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 3. Gallery Item Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-[2rem] w-full max-w-3xl my-8 overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border-4 border-white">
                <div className="px-8 py-5 border-b border-gray-100 bg-white flex justify-between items-center flex-shrink-0">
                    <h3 className="font-black text-xl text-gray-800 flex items-center gap-2">
                        {editingItem ? <Edit2 size={24} className="text-primary-dark"/> : <Sparkle size={24} className="text-primary-dark"/>}
                        {editingItem ? ' 編輯圖鑑' : ' 新增圖鑑'}
                    </h3>
                    <button onClick={() => setIsFormOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer">✕</button>
                </div>
                
                <form onSubmit={handleFormSubmit} className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                    <div className="flex flex-col md:flex-row gap-8">
                         {/* Image Section */}
                        <div className="flex-shrink-0 flex justify-center md:justify-start">
                            <div className="w-full max-w-xs md:w-64">
                                 <ImageCropper 
                                    key={editingItem ? editingItem.id : 'new-item'}
                                    initialImage={formData.image} 
                                    onImageCropped={(base64) => setFormData(prev => ({ ...prev, image: base64 }))} 
                                 />
                                 <p className="text-xs text-center text-gray-400 mt-3 font-medium">支援上傳後裁切為正方形</p>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="flex-1 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">品項名稱 <span className="text-secondary-dark">*</span></label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border-2 border-gray-100 rounded-xl shadow-sm focus:border-primary focus:outline-none p-3 font-medium bg-white text-gray-900"
                                    placeholder="例如: 2024年生日徽章"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">商品原文名稱 <span className="text-xs font-normal text-gray-400">(非必填)</span></label>
                                <input
                                    type="text"
                                    value={formData.originalName || ''}
                                    onChange={e => setFormData({ ...formData, originalName: e.target.value })}
                                    className="w-full border-2 border-gray-100 rounded-xl shadow-sm focus:border-primary focus:outline-none p-3 font-medium bg-white text-gray-900 text-sm"
                                    placeholder="例如: 2024 Birthday Badge"
                                />
                            </div>
                            <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">所屬作品 <span className="text-secondary-dark">*</span></label>
                                 <div className="relative">
                                    <select
                                        required
                                        value={formData.workId || ''}
                                        onChange={e => setFormData({ ...formData, workId: e.target.value })}
                                        className="w-full border-2 border-gray-100 rounded-xl shadow-sm focus:border-primary focus:outline-none p-3 appearance-none bg-white font-medium text-gray-900"
                                    >
                                        <option value="" disabled>選擇作品</option>
                                        {works.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                    <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">▼</div>
                                 </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-dashed border-gray-200"></div>

                    {/* Specs Section */}
                    <div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <label className="text-lg font-black text-gray-800 flex items-center gap-2">
                                <Grid size={20} className="text-secondary-dark" /> 規格管理
                            </label>
                            
                            <div className="flex flex-wrap items-center gap-2">
                                {/* New Buttons */}
                                <button 
                                    type="button" 
                                    onClick={handleOpenBatchModal}
                                    className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-200 transition border border-gray-200 flex items-center gap-2"
                                >
                                    <Layers size={16} /> 批量新增
                                </button>
                                
                                <div className="h-6 w-px bg-gray-300 mx-1 hidden md:block"></div>

                                <button 
                                    type="button" 
                                    onClick={handleAddSpec}
                                    className="bg-primary/20 text-gray-800 p-2 rounded-lg hover:bg-primary/40 transition"
                                    title="新增單一規格"
                                >
                                    <Plus size={18} />
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setIsSpecEditMode(!isSpecEditMode)}
                                    className={`p-2 rounded-lg font-bold text-sm transition flex items-center gap-1 ${isSpecEditMode ? 'bg-gray-800 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                >
                                    {isSpecEditMode ? <Check size={16}/> : <Edit2 size={16}/>}
                                    {isSpecEditMode ? '完成編輯' : '編輯'}
                                </button>
                            </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 min-h-[100px]">
                            {formSpecs.length === 0 ? (
                                <div className="text-center text-gray-400 py-8 text-sm font-medium">
                                    尚未建立規格<br/>
                                    請使用上方按鈕新增 (例如: 批量新增 {'>'} 10)
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                    {formSpecs.map((spec) => (
                                        <div 
                                            key={spec.id}
                                            onClick={() => !isSpecEditMode && toggleSpecOwned(spec.id)}
                                            className={`relative rounded-xl p-2 md:p-3 text-center transition-all cursor-pointer border-2 select-none flex items-center justify-center min-h-[3rem] ${
                                                isSpecEditMode 
                                                    ? 'bg-white border-dashed border-gray-300' 
                                                    : spec.isOwned 
                                                        ? 'bg-secondary text-white border-secondary shadow-md shadow-secondary/30 scale-105 font-bold' 
                                                        : 'bg-white text-gray-500 border-gray-200 hover:border-secondary/50 font-medium'
                                            }`}
                                        >
                                            {isSpecEditMode ? (
                                                <>
                                                    <input 
                                                        type="text" 
                                                        value={spec.name}
                                                        onChange={(e) => updateSpecName(spec.id, e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-full text-center text-sm font-bold text-gray-700 bg-transparent focus:outline-none border-b border-gray-200 focus:border-secondary"
                                                    />
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); deleteSpec(spec.id); }}
                                                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:scale-110 transition"
                                                    >
                                                        <X size={10} strokeWidth={3} />
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-sm truncate w-full">{spec.name}</span>
                                            )}
                                            
                                            {/* Checkmark for owned state */}
                                            {!isSpecEditMode && spec.isOwned && (
                                                <div className="absolute -top-1.5 -right-1.5 bg-white text-secondary rounded-full p-0.5 shadow-sm">
                                                    <Check size={10} strokeWidth={4} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-right">
                             {isSpecEditMode ? '編輯模式：可修改名稱或刪除' : '點擊規格可標記為「已擁有」'}
                        </p>
                    </div>

                </form>
                
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4 flex-shrink-0">
                    {editingItem && (
                        <button
                            type="button"
                            onClick={(e) => handleDeleteItem(editingItem.id, e)}
                            className="px-4 py-3 border-2 border-red-100 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 hover:border-red-200 font-bold transition flex items-center justify-center cursor-pointer"
                            title="刪除此圖鑑"
                        >
                            <Trash2 size={20} className="pointer-events-none" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setIsFormOpen(false)}
                        className="flex-1 py-3 border-2 border-gray-200 text-gray-500 rounded-xl hover:bg-white hover:border-gray-300 font-bold transition cursor-pointer"
                    >
                        取消
                    </button>
                    <button
                        type="button"
                        onClick={handleFormSubmit}
                        className="flex-1 py-3 bg-primary text-gray-900 rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/20 font-bold transition transform active:scale-95 cursor-pointer"
                    >
                        儲存
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* 4. Batch Add Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl border-4 border-white animate-in zoom-in-95">
              <div className="p-6">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                         <Layers size={20} className="text-secondary-dark"/> 批量新增規格
                     </h3>
                     <button onClick={() => setIsBatchModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 transition">
                         <X size={18} />
                     </button>
                 </div>
                 
                 <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">新增數量</label>
                        <input 
                            autoFocus
                            type="number" 
                            min="1"
                            max="100"
                            value={batchCount}
                            onChange={(e) => setBatchCount(parseInt(e.target.value) || 0)}
                            className="w-full border-2 border-gray-100 rounded-xl p-3 text-center text-xl font-black text-gray-900 bg-white shadow-sm focus:border-secondary focus:outline-none"
                        />
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
                        <p className="text-gray-500 font-medium mb-1">將會新增：</p>
                        <p className="text-gray-800 font-bold">
                            {batchCount > 0 ? (
                                `規格 #${formSpecs.length + 1} ~ #${formSpecs.length + batchCount}`
                            ) : (
                                '-'
                            )}
                        </p>
                    </div>
                 </div>

                 <div className="flex gap-3">
                    <button 
                      onClick={() => setIsBatchModalOpen(false)}
                      className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition cursor-pointer"
                    >
                       取消
                    </button>
                    <button 
                      disabled={batchCount <= 0}
                      onClick={handleConfirmBatchAdd}
                      className="flex-1 py-3 bg-primary text-gray-900 rounded-xl font-bold shadow-md shadow-primary/20 hover:bg-primary-dark transition transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       確認新增
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmConfig && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border-2 border-white animate-in zoom-in-95">
              <div className="p-6">
                 <h3 className="text-lg font-black text-gray-800 mb-3">{confirmConfig.title}</h3>
                 <div className="text-sm font-medium text-gray-600 mb-6 leading-relaxed">
                    {confirmConfig.message}
                 </div>
                 <div className="flex gap-3">
                    <button 
                      onClick={() => setConfirmConfig(null)}
                      className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition cursor-pointer"
                    >
                       取消
                    </button>
                    <button 
                      onClick={confirmConfig.onConfirm}
                      className={`flex-1 py-2.5 text-white rounded-xl font-bold shadow-md transition transform active:scale-95 cursor-pointer ${confirmConfig.isDangerous ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-primary text-gray-900 hover:bg-primary-dark'}`}
                    >
                       確認刪除
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
