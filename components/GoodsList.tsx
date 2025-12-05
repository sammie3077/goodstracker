
import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storageService';
import { GoodsItem, Work, Category, ItemStatus, PaymentStatus, SourceType, SortOption, ProxyService, ConditionStatus } from '../types';
import { Plus, Search, Filter, ArrowUpDown, Tag, MapPin, DollarSign, Package, Trash2, X, Settings, Edit2, Check, AlertTriangle, Calculator, ChevronDown, ChevronRight, TrendingUp, Sparkles } from 'lucide-react';
import { ImageCropper } from './ImageCropper';

export const GoodsList: React.FC = () => {
  // Data State
  const [items, setItems] = useState<GoodsItem[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [proxies, setProxies] = useState<ProxyService[]>([]);
  
  // UI State
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GoodsItem | null>(null);
  
  // Filters & Sort
  const [sortBy, setSortBy] = useState<SortOption>('created_desc');
  const [filterStatus, setFilterStatus] = useState<ItemStatus | 'ALL'>('ALL');

  // Modals
  const [isAddWorkOpen, setIsAddWorkOpen] = useState(false);
  const [newWorkName, setNewWorkName] = useState('');
  
  // Stats Modal
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [expandedStatWorkId, setExpandedStatWorkId] = useState<string | null>(null);
  
  // Work & Category Manager Modal State
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [managerTab, setManagerTab] = useState<'work' | 'categories'>('categories');
  const [editWorkName, setEditWorkName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // Item Form State
  const [formData, setFormData] = useState<Partial<GoodsItem>>({});
  
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setItems(StorageService.getItems());
    setWorks(StorageService.getWorks());
    setProxies(StorageService.getProxies());
  };

  // --- Computed ---
  const filteredItems = useMemo(() => {
    let result = items;
    if (selectedWorkId) {
      result = result.filter(i => i.workId === selectedWorkId);
    }
    if (selectedCategoryId) {
      result = result.filter(i => i.categoryId === selectedCategoryId);
    }
    if (filterStatus !== 'ALL') {
      result = result.filter(i => i.status === filterStatus);
    }

    return result.sort((a, b) => {
      switch (sortBy) {
        case 'price_desc': return b.price - a.price;
        case 'price_asc': return a.price - b.price;
        case 'quantity_desc': return b.quantity - a.quantity;
        case 'quantity_asc': return a.quantity - b.quantity;
        case 'total_desc': return (b.price * b.quantity) - (a.price * a.quantity);
        case 'total_asc': return (a.price * a.quantity) - (b.price * b.quantity);
        case 'created_asc': return a.createdAt - b.createdAt;
        case 'created_desc': default: return b.createdAt - a.createdAt;
      }
    });
  }, [items, selectedWorkId, selectedCategoryId, sortBy, filterStatus]);

  // Calculate Total Value for Current View
  const currentViewTotal = useMemo(() => {
      return filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [filteredItems]);

  // Statistics Calculation
  const statistics = useMemo(() => {
      const grandTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const workStats = works.map(work => {
          const workItems = items.filter(i => i.workId === work.id);
          const total = workItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
          
          const categoryStats = work.categories.map(cat => {
              const catItems = workItems.filter(i => i.categoryId === cat.id);
              const catTotal = catItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
              return { name: cat.name, total: catTotal, count: catItems.length };
          });

          return { 
              id: work.id, 
              name: work.name, 
              total, 
              count: workItems.length,
              categories: categoryStats 
          };
      }).sort((a, b) => b.total - a.total); // Sort by highest value

      return { grandTotal, workStats };
  }, [items, works]);

  const currentWork = works.find(w => w.id === selectedWorkId);

  // --- Handlers ---

  const handleCreateWork = () => {
    if (newWorkName.trim()) {
      const work = StorageService.addWork(newWorkName);
      setWorks(StorageService.getWorks());
      setSelectedWorkId(work.id);
      setNewWorkName('');
      setIsAddWorkOpen(false);
    }
  };

  // Manager Modal Handlers
  const openManager = () => {
    if (currentWork) {
      setEditWorkName(currentWork.name);
      setNewCategoryName('');
      setEditingCatId(null);
      setManagerTab('categories');
      setIsManagerOpen(true);
    }
  };

  const handleUpdateWorkName = () => {
    if (selectedWorkId && editWorkName.trim()) {
      StorageService.updateWork(selectedWorkId, editWorkName);
      refreshData();
      alert('作品名稱已更新');
    }
  };

  const handleDeleteWork = () => {
    if (!selectedWorkId || !currentWork) return;
    
    if (window.confirm(`⚠️ 危險動作\n\n確定要刪除作品「${currentWork.name}」嗎？\n\n注意：該作品底下的【所有周邊】也會一併被刪除！此動作無法復原。`)) {
        try {
            StorageService.deleteWork(selectedWorkId);
            setSelectedWorkId(null);
            setSelectedCategoryId(null);
            setIsManagerOpen(false);
            refreshData();
        } catch (e) {
            alert('刪除失敗');
            console.error(e);
        }
    }
  };

  const handleAddCategory = () => {
    if (selectedWorkId && newCategoryName.trim()) {
      StorageService.addCategoryToWork(selectedWorkId, newCategoryName);
      setNewCategoryName('');
      refreshData();
    }
  };

  const handleUpdateCategory = (catId: string) => {
    if (selectedWorkId && editingCatName.trim()) {
      StorageService.updateCategory(selectedWorkId, catId, editingCatName);
      setEditingCatId(null);
      refreshData();
    }
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
      if (!selectedWorkId) return;
      if (window.confirm(`確定要刪除分類「${catName}」嗎？\n\n該分類下的周邊也會一併刪除。`)) {
          StorageService.deleteCategory(selectedWorkId, catId);
          if (selectedCategoryId === catId) {
              setSelectedCategoryId(null);
          }
          refreshData();
      }
  };

  const openForm = (item?: GoodsItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
    } else {
      setEditingItem(null);
      setFormData({
        workId: selectedWorkId || (works.length > 0 ? works[0].id : ''),
        categoryId: selectedCategoryId || '',
        quantity: 1,
        price: 0,
        status: ItemStatus.PREORDER,
        paymentStatus: PaymentStatus.PAID_FULL,
        condition: ConditionStatus.NEW,
        sourceType: SourceType.PROXY,
        createdAt: Date.now()
      });
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.workId || !formData.categoryId) {
      alert('請填寫完整資訊');
      return;
    }

    const payload = {
      ...formData,
      id: editingItem?.id || crypto.randomUUID(),
      // Ensure numerical values are numbers, default to 0 if empty
      price: Number(formData.price || 0),
      quantity: Number(formData.quantity || 0),
      depositAmount: formData.depositAmount ? Number(formData.depositAmount) : undefined,
    } as GoodsItem;

    try {
        if (editingItem) {
          StorageService.updateItem(payload);
        } else {
          StorageService.addItem(payload);
        }
        setIsFormOpen(false);
        refreshData();
    } catch (error) {
        console.error(error);
        alert('儲存失敗！可能是因為圖片太大導致瀏覽器儲存空間不足。\n請嘗試刪除一些舊資料。');
    }
  };

  const handleDeleteItem = (id: string, e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      
      // Removed setTimeout logic to fix deletion issues on some devices
      if(window.confirm('確定要刪除這個周邊嗎？')) {
          StorageService.deleteItem(id);
          // If we are currently editing this item (e.g. from modal), close modal
          if (editingItem?.id === id) {
              setIsFormOpen(false);
              setEditingItem(null);
          }
          refreshData();
      }
  };

  // --- Render Helpers ---

  const getStatusColor = (status: ItemStatus) => {
    switch (status) {
      case ItemStatus.ARRIVED: return 'bg-green-100 text-green-800 border-green-200';
      case ItemStatus.PREORDER: return 'bg-blue-100 text-blue-800 border-blue-200';
      case ItemStatus.NOT_ON_HAND: return 'bg-gray-100 text-gray-600 border-gray-200';
      case ItemStatus.FOR_SALE: return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-gray-100';
    }
  };

  const getConditionColor = (cond?: ConditionStatus) => {
      if (cond === ConditionStatus.OPENED) return 'bg-orange-50 text-orange-600 border-orange-100';
      return 'bg-cyan-50 text-cyan-600 border-cyan-100'; // Default New
  };

  // Safe Input Handler for Numbers
  const handleNumberInput = (field: string, val: string) => {
      setFormData({
          ...formData,
          [field]: val === '' ? ('' as any) : Number(val)
      });
  };

  return (
    // Fixed height container for App-like layout (Viewport - Nav Height)
    <div className="flex flex-col md:flex-row h-[calc(100dvh-4rem)] md:h-[calc(100vh-5rem)] overflow-hidden bg-background transition-colors duration-500">
      {/* Sidebar: Works */}
      <aside className="hidden md:block w-64 bg-white/60 backdrop-blur-sm border-r border-primary-light flex-shrink-0 h-full overflow-y-auto custom-scrollbar">
        <div className="p-4 border-b border-primary-light flex justify-between items-center bg-primary-light/30 sticky top-0 z-10 backdrop-blur-md">
          <h2 className="font-bold text-gray-700 flex items-center gap-2">
            <span className="text-xl">📚</span> 作品列表
          </h2>
          <button type="button" onClick={() => setIsAddWorkOpen(true)} className="p-1.5 hover:bg-white bg-white/50 text-gray-600 rounded-full shadow-sm transition-all hover:scale-105 hover:text-primary-dark cursor-pointer">
            <Plus size={18} className="pointer-events-none" />
          </button>
        </div>
        <div className="py-2 space-y-0.5">
          <button
            type="button"
            onClick={() => { setSelectedWorkId(null); setSelectedCategoryId(null); }}
            className={`w-full text-left px-5 py-3 text-sm transition font-bold border-l-4 hover:bg-primary-light/50 cursor-pointer ${!selectedWorkId ? 'border-primary bg-primary-light/50 text-gray-900' : 'border-transparent text-gray-500'}`}
          >
            全部作品
          </button>
          {works.map(work => (
            <div key={work.id} className="relative group">
                <button
                  type="button"
                  onClick={() => { setSelectedWorkId(work.id); setSelectedCategoryId(null); }}
                  className={`w-full text-left px-5 py-3 text-sm transition font-bold truncate border-l-4 hover:bg-primary-light/50 cursor-pointer ${selectedWorkId === work.id ? 'border-primary bg-primary-light/50 text-gray-900' : 'border-transparent text-gray-500'}`}
                >
                  {work.name}
                </button>
            </div>
          ))}
        </div>
        
        {/* Desktop Total Summary in Sidebar */}
        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-white to-white/90 backdrop-blur-sm border-t border-primary-light">
           <button
             type="button"
             onClick={() => setIsStatsOpen(true)}
             className="w-full bg-secondary/10 hover:bg-secondary/20 text-secondary-dark rounded-xl p-3 flex items-center justify-between group transition-colors cursor-pointer"
           >
              <div className="flex items-center gap-2 pointer-events-none">
                 <div className="p-1.5 bg-white rounded-full text-secondary shadow-sm">
                    <TrendingUp size={16} />
                 </div>
                 <div className="text-left">
                    <span className="font-bold text-xs block opacity-70">總資產估值</span>
                    <span className="font-black text-sm">${statistics.grandTotal.toLocaleString()}</span>
                 </div>
              </div>
              <ChevronRight size={16} className="text-secondary/50 group-hover:text-secondary pointer-events-none" />
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full max-w-[100vw] h-full overflow-hidden relative">
        {/* Top Filter Bar - Fixed within Flex Column */}
        <header className="bg-background p-4 border-b border-primary-light flex flex-col gap-4 z-30 shadow-sm flex-shrink-0 transition-colors duration-500">
            {/* Mobile Work Selector */}
            <div className="md:hidden flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar border-b border-primary-light/50">
                 <button type="button" onClick={() => setIsAddWorkOpen(true)} className="flex-shrink-0 p-2 bg-primary-light text-primary-dark rounded-full shadow-sm cursor-pointer">
                    <Plus size={16} className="pointer-events-none" />
                 </button>
                 <button
                    type="button"
                    onClick={() => { setSelectedWorkId(null); setSelectedCategoryId(null); }}
                    className={`whitespace-nowrap px-2 py-2 text-sm font-bold transition border-b-2 cursor-pointer ${!selectedWorkId ? 'border-primary text-gray-900' : 'border-transparent text-gray-500'}`}
                 >
                    全部作品
                 </button>
                 {works.map(w => (
                     <button
                        key={w.id}
                        type="button"
                        onClick={() => { setSelectedWorkId(w.id); setSelectedCategoryId(null); }}
                        className={`whitespace-nowrap px-2 py-2 text-sm font-bold transition border-b-2 cursor-pointer ${selectedWorkId === w.id ? 'border-primary text-gray-900' : 'border-transparent text-gray-500'}`}
                     >
                        {w.name}
                     </button>
                 ))}
            </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
             {/* Categories (Tabs) */}
             <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:max-w-xl pb-1">
                {selectedWorkId && currentWork ? (
                  <>
                    <button
                        type="button"
                        onClick={openManager}
                        className="flex-shrink-0 p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full mr-2 transition-colors cursor-pointer"
                        title="管理作品與分類"
                    >
                        <Settings size={18} className="pointer-events-none" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedCategoryId(null)}
                        className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border-2 transition cursor-pointer ${!selectedCategoryId ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-primary-light hover:border-gray-300'}`}
                    >
                        全部
                    </button>
                    {currentWork.categories.map(cat => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategoryId(cat.id)}
                            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border-2 transition cursor-pointer ${selectedCategoryId === cat.id ? 'bg-primary text-gray-900 border-primary' : 'bg-white text-gray-600 border-primary-light hover:border-primary/50'}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                    <button type="button" onClick={openManager} className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs text-gray-400 border-2 border-dashed border-gray-300 hover:bg-primary-light hover:border-primary hover:text-primary-dark flex items-center gap-1 font-bold cursor-pointer">
                        <Plus size={14} className="pointer-events-none" /> 編輯
                    </button>
                  </>
                ) : (
                    <div className="flex items-center gap-2">
                         <div className="text-lg font-black text-gray-800 tracking-tight flex items-center gap-2">
                            <span className="text-xl">✨</span> 周邊一覽
                         </div>
                    </div>
                )}
             </div>

             <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 md:ml-auto">
                {/* Mobile Stats Button (View Detailed Breakdown) */}
                <button
                    type="button"
                    onClick={() => setIsStatsOpen(true)}
                    className="md:hidden shrink-0 bg-white border-2 border-primary-light text-primary-dark p-2 rounded-full shadow-sm cursor-pointer"
                >
                    <Calculator size={18} className="pointer-events-none" />
                </button>

                <div className="relative group shrink-0">
                    <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="appearance-none bg-white border-2 border-primary-light text-xs md:text-sm rounded-full pl-8 pr-6 py-2 focus:outline-none focus:border-primary text-gray-700 cursor-pointer shadow-sm hover:border-primary/50 transition-colors font-medium"
                    >
                        <option value="ALL">所有狀態</option>
                        {Object.values(ItemStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <Filter className="absolute left-2.5 top-2.5 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                </div>
                
                <div className="relative group shrink-0">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="appearance-none bg-white border-2 border-primary-light text-xs md:text-sm rounded-full pl-8 pr-6 py-2 focus:outline-none focus:border-primary text-gray-700 cursor-pointer shadow-sm hover:border-primary/50 transition-colors font-medium"
                    >
                        <option value="created_desc">最新</option>
                        <option value="created_asc">最舊</option>
                        <option value="price_desc">單價高</option>
                        <option value="price_asc">單價低</option>
                        <option value="total_desc">總價高</option>
                        <option value="total_asc">總價低</option>
                        <option value="quantity_desc">數量多</option>
                        <option value="quantity_asc">數量少</option>
                    </select>
                    <ArrowUpDown className="absolute left-2.5 top-2.5 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                </div>

                <button
                    type="button"
                    onClick={() => openForm()}
                    className="shrink-0 bg-primary hover:bg-primary-dark text-gray-900 pl-4 pr-5 py-2 rounded-full flex items-center gap-2 text-sm shadow-md shadow-primary/30 transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                    <Plus size={18} strokeWidth={3} className="pointer-events-none" />
                    <span className="hidden sm:inline font-bold pointer-events-none">新增</span>
                </button>
             </div>
          </div>
        </header>

        {/* Dedicated Summary Bar - Fixed below header */}
        <div className="bg-primary-light/50 border-b border-primary-light px-4 md:px-6 py-2 flex justify-between items-center text-xs font-bold text-primary-dark shadow-inner flex-shrink-0 z-20 transition-colors duration-500">
            <span className="flex items-center gap-1.5 opacity-80">
                <Package size={14} className="text-primary-dark"/> 
                {filteredItems.length} 個項目
            </span>
            <span className="flex items-center gap-1.5 text-primary-dark">
                <span className="opacity-60 text-[10px] uppercase tracking-wide">Total</span>
                <span className="font-black text-sm md:text-base tracking-tight">${currentViewTotal.toLocaleString()}</span>
            </span>
        </div>

        {/* Grid Content - Independent Scroll */}
        <div className="p-2 md:p-6 flex-1 overflow-y-auto custom-scrollbar pb-24 md:pb-6">
            {/* 3 Columns on Mobile (grid-cols-3) */}
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-5">
                {filteredItems.map(item => (
                    <div 
                        key={item.id} 
                        onClick={() => openForm(item)}
                        className="bg-white rounded-xl md:rounded-3xl shadow-sm border border-primary-light overflow-hidden hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group flex flex-col hover:-translate-y-1 cursor-pointer"
                    >
                        <div className="relative aspect-square bg-gray-50 overflow-hidden m-1 md:m-2 rounded-lg md:rounded-2xl">
                            {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 z-0" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-200">
                                    <Package size={24} />
                                </div>
                            )}
                            
                            {/* Status Tag (Top Right) */}
                            <div className="absolute top-1 right-1 md:top-2 md:right-2 flex flex-col gap-1 items-end z-10">
                                <span className={`px-1.5 py-0.5 md:px-3 md:py-1 rounded-full text-[9px] md:text-xs font-bold border shadow-sm backdrop-blur-md bg-white/95 ${getStatusColor(item.status)}`}>
                                    {item.status}
                                </span>
                            </div>

                            {/* NEW: Condition Tag (Top Left) */}
                            <div className="absolute top-1 left-1 md:top-2 md:left-2 flex flex-col gap-1 items-start z-10">
                                <span className={`px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-md text-[8px] md:text-[10px] font-bold border shadow-sm backdrop-blur-md bg-white/95 flex items-center gap-0.5 ${getConditionColor(item.condition)}`}>
                                    {item.condition === ConditionStatus.NEW && <Sparkles size={8} className="md:w-3 md:h-3" />}
                                    {item.condition || ConditionStatus.NEW}
                                </span>
                            </div>

                            {/* Hover Edit Overlay - Visible on Desktop Hover */}
                            <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-[1px] opacity-0 md:group-hover:opacity-100 transition-opacity flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 z-20 pointer-events-none md:pointer-events-auto">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); openForm(item); }}
                                    className="bg-white text-gray-700 p-1.5 md:px-5 md:py-2 rounded-full text-xs font-bold shadow-lg hover:scale-110 transition-transform pointer-events-auto cursor-pointer"
                                >
                                    <Edit2 size={14} className="pointer-events-none"/>
                                </button>
                            </div>
                        </div>
                        
                        <div className="px-2 md:px-5 pb-2 md:pb-5 pt-0.5 md:pt-1 flex flex-col flex-1">
                            <h3 className="font-bold text-gray-800 text-[11px] md:text-lg mb-0.5 md:mb-1 truncate leading-tight">{item.name}</h3>
                            
                            <div className="flex flex-col md:flex-row justify-between md:items-end mt-auto gap-0.5 md:gap-1">
                                <div className="space-y-0 md:space-y-1">
                                    <p className="text-gray-400 text-[10px] md:text-xs flex items-center gap-1 font-medium hidden md:flex">
                                        <Tag size={12} /> 
                                        ${item.price} × {item.quantity}
                                    </p>
                                    <p className="text-secondary-dark font-black text-xs md:text-2xl tracking-tight leading-none">
                                        ${(item.price * item.quantity).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-left md:text-right space-y-0.5 md:space-y-1">
                                    {item.paymentStatus === PaymentStatus.PAID_DEPOSIT && (
                                        <span className="text-[9px] md:text-xs px-1 md:px-2 py-0.5 rounded-md bg-yellow-50 text-yellow-600 border border-yellow-100 block w-fit md:ml-auto font-medium truncate max-w-full scale-90 md:scale-100 origin-left">
                                            訂金 ${item.depositAmount}
                                        </span>
                                    )}
                                    <span className={`text-[9px] md:text-xs px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md border block w-fit md:ml-auto font-bold truncate max-w-full scale-90 md:scale-100 origin-left ${
                                        item.paymentStatus === PaymentStatus.PAID_FULL ? 'bg-secondary/10 text-secondary-dark border-secondary/20' :
                                        item.paymentStatus === PaymentStatus.FORGOTTEN ? 'bg-purple-50 text-purple-500 border-purple-100' :
                                        item.paymentStatus === PaymentStatus.COD ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-orange-50 text-orange-400 border-orange-100'
                                    }`}>
                                        {item.paymentStatus}
                                    </span>
                                </div>
                            </div>

                             {/* Source Info (Desktop Only) */}
                            <div className="hidden md:flex mt-4 pt-3 border-t border-dashed border-gray-100 items-center text-xs text-gray-400 gap-1.5 truncate">
                                {item.sourceType === SourceType.PROXY ? (
                                    <>
                                        <div className="p-1 bg-primary-light rounded-full text-gray-600"><Package size={10} /></div>
                                        <span className="font-medium">代購: <span className="text-gray-600">{proxies.find(p => p.id === item.proxyId)?.name || '未知'}</span></span>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-1 bg-blue-50 rounded-full text-blue-400"><MapPin size={10} /></div>
                                        <span className="font-medium">自購: <span className="text-gray-600">{item.purchaseLocation || '未填寫'}</span></span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {filteredItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <div className="bg-white p-6 rounded-full mb-4 shadow-sm border border-primary-light">
                        <Search size={48} className="text-primary-light" />
                    </div>
                    <p className="font-medium">沒有找到相關周邊</p>
                    <button type="button" onClick={() => openForm()} className="mt-4 text-gray-600 bg-primary/20 px-4 py-2 rounded-full text-sm font-bold hover:bg-primary/40 transition cursor-pointer">新增第一筆資料？</button>
                </div>
            )}
        </div>
      </main>

      {/* --- Modals --- */}

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
                      <button type="button" onClick={() => setIsAddWorkOpen(false)} className="flex-1 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition cursor-pointer">取消</button>
                      <button type="button" onClick={handleCreateWork} className="flex-1 py-3 bg-primary text-gray-900 rounded-xl hover:bg-primary-dark font-bold shadow-lg shadow-primary/30 transition cursor-pointer">建立</button>
                  </div>
              </div>
          </div>
      )}

      {/* 2. Manager Modal */}
      {isManagerOpen && currentWork && (
          <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl border-4 border-white flex flex-col max-h-[85vh] overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-primary-light/30">
                      <h3 className="font-black text-lg text-gray-700 flex items-center gap-2">
                        <Settings size={20} className="text-gray-400" />
                        管理：{currentWork.name}
                      </h3>
                      <button type="button" onClick={() => setIsManagerOpen(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 flex items-center justify-center transition-colors cursor-pointer">
                          <X size={20} />
                      </button>
                  </div>

                  <div className="flex border-b border-gray-100">
                      <button
                        type="button"
                        onClick={() => setManagerTab('categories')}
                        className={`flex-1 py-3 font-bold text-sm transition-colors cursor-pointer ${managerTab === 'categories' ? 'text-primary-dark border-b-2 border-primary bg-primary/5' : 'text-gray-400 hover:bg-gray-50'}`}
                      >
                        分類管理
                      </button>
                      <button
                        type="button"
                        onClick={() => setManagerTab('work')}
                        className={`flex-1 py-3 font-bold text-sm transition-colors cursor-pointer ${managerTab === 'work' ? 'text-primary-dark border-b-2 border-primary bg-primary/5' : 'text-gray-400 hover:bg-gray-50'}`}
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
                                  <button type="button" onClick={handleAddCategory} disabled={!newCategoryName.trim()} className="bg-gray-800 text-white px-4 rounded-xl font-bold text-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                                    新增
                                  </button>
                              </div>

                              <div className="space-y-2">
                                  {currentWork.categories.map(cat => (
                                      <div key={cat.id} className="flex items-center gap-2 p-3 bg-white border border-gray-100 rounded-xl hover:border-primary-light transition-colors group">
                                          {editingCatId === cat.id ? (
                                              <div className="flex-1 flex gap-2">
                                                  <input 
                                                    autoFocus
                                                    type="text" 
                                                    value={editingCatName}
                                                    onChange={e => setEditingCatName(e.target.value)}
                                                    className="flex-1 border-b-2 border-primary focus:outline-none font-bold text-gray-900 bg-transparent px-1"
                                                  />
                                                  <button type="button" onClick={() => handleUpdateCategory(cat.id)} className="text-green-500 hover:bg-green-50 p-1 rounded cursor-pointer">
                                                      <Check size={16} />
                                                  </button>
                                                  <button type="button" onClick={() => setEditingCatId(null)} className="text-gray-400 hover:bg-gray-50 p-1 rounded cursor-pointer">
                                                      <X size={16} />
                                                  </button>
                                              </div>
                                          ) : (
                                              <>
                                                  <span className="flex-1 font-bold text-gray-600 px-1">{cat.name}</span>
                                                  <div className="flex gap-2">
                                                      <button
                                                        onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }}
                                                        className="p-2 md:p-2 min-w-[40px] min-h-[40px] md:min-w-0 md:min-h-0 flex items-center justify-center text-gray-400 hover:text-primary-dark hover:bg-primary-light rounded-lg transition-colors cursor-pointer"
                                                      >
                                                          <Edit2 size={18} className="pointer-events-none" />
                                                      </button>
                                                      <button
                                                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                                        className="p-2 md:p-2 min-w-[40px] min-h-[40px] md:min-w-0 md:min-h-0 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                      >
                                                          <Trash2 size={18} className="pointer-events-none" />
                                                      </button>
                                                  </div>
                                              </>
                                          )}
                                      </div>
                                  ))}
                                  {currentWork.categories.length === 0 && (
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
                                      <button type="button" onClick={handleUpdateWorkName} className="bg-primary text-gray-900 px-5 rounded-xl font-bold shadow-md shadow-primary/20 hover:bg-primary-dark cursor-pointer">
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
                                    type="button"
                                    onClick={handleDeleteWork}
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
      )}

      {/* 3. Statistics Modal */}
      {isStatsOpen && (
          <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl border-4 border-white flex flex-col max-h-[85vh] overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 bg-primary-light/30 flex justify-between items-center flex-shrink-0">
                      <div>
                          <h3 className="font-black text-xl text-gray-800 flex items-center gap-2">
                             <TrendingUp size={24} className="text-secondary-dark" />
                             資產統計
                          </h3>
                          <p className="text-xs text-gray-500 font-bold mt-1">目前所有收藏的總價值統計</p>
                      </div>
                      <button type="button" onClick={() => setIsStatsOpen(false)} className="w-8 h-8 rounded-full bg-white text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm cursor-pointer">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="overflow-y-auto custom-scrollbar flex-1 bg-white p-6">
                      {/* Grand Total Card */}
                      <div className="bg-gradient-to-br from-secondary to-secondary-dark rounded-3xl p-6 text-white shadow-lg shadow-secondary/20 mb-8 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                          <p className="text-white font-bold mb-1 opacity-80">總資產估值 (Grand Total)</p>
                          <h2 className="text-4xl font-black tracking-tight">${statistics.grandTotal.toLocaleString()}</h2>
                      </div>

                      <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                          <Package size={18} /> 作品排行
                      </h4>
                      
                      <div className="space-y-3">
                          {statistics.workStats.map((stat) => (
                              <div key={stat.id} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedStatWorkId(expandedStatWorkId === stat.id ? null : stat.id)}
                                    className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                                  >
                                      <div className="flex items-center gap-3">
                                          <div className={`transition-transform duration-300 ${expandedStatWorkId === stat.id ? 'rotate-90' : ''}`}>
                                              <ChevronRight size={16} className="text-gray-400" />
                                          </div>
                                          <div className="text-left">
                                              <p className="font-bold text-gray-800">{stat.name}</p>
                                              <p className="text-xs text-gray-400 font-medium">{stat.count} 項物品</p>
                                          </div>
                                      </div>
                                      <p className="font-black text-gray-700">${stat.total.toLocaleString()}</p>
                                  </button>
                                  
                                  {/* Categories Breakdown */}
                                  {expandedStatWorkId === stat.id && (
                                      <div className="bg-gray-50 p-3 space-y-1 border-t border-gray-100">
                                          {stat.categories.filter(c => c.total > 0).map((cat, idx) => (
                                              <div key={idx} className="flex justify-between items-center py-2 px-3 rounded-xl hover:bg-gray-100 transition-colors">
                                                  <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                                      <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                                                      {cat.name}
                                                  </span>
                                                  <span className="text-sm font-bold text-gray-500">${cat.total.toLocaleString()}</span>
                                              </div>
                                          ))}
                                          {stat.categories.every(c => c.total === 0) && (
                                              <p className="text-center text-xs text-gray-400 py-2">無金額資料</p>
                                          )}
                                      </div>
                                  )}
                              </div>
                          ))}
                          
                          {statistics.workStats.length === 0 && (
                              <p className="text-center text-gray-400 py-8">目前沒有資料</p>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 4. Item Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl my-8 overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border-4 border-white">
                <div className="px-8 py-5 border-b border-gray-100 bg-white flex justify-between items-center flex-shrink-0">
                    <h3 className="font-black text-xl text-gray-800 flex items-center gap-2">
                        {editingItem ? '✏️ 編輯周邊' : '✨ 新增周邊'}
                    </h3>
                    <button type="button" onClick={() => setIsFormOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer">✕</button>
                </div>
                
                <form onSubmit={handleFormSubmit} className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                    {/* Image Section */}
                    <div className="flex justify-center">
                        <div className="w-full max-w-xs">
                             <ImageCropper
                                initialImage={formData.image}
                                onImageCropped={(base64) => setFormData(prev => ({ ...prev, image: base64 }))}
                             />
                             <p className="text-xs text-center text-gray-400 mt-3 font-medium">上傳後可選擇性裁切為正方形</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div className="col-span-full">
                            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">品項名稱 <span className="text-secondary-dark">*</span></label>
                            <input
                                required
                                type="text"
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full border-2 border-gray-100 rounded-xl shadow-sm focus:border-primary focus:outline-none p-3 font-medium bg-white text-gray-900"
                                placeholder="例如: 2024年生日徽章"
                            />
                            {/* NEW: Original Name (Optional) */}
                            <div className="mt-4">
                                <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">商品原文名稱 <span className="text-xs font-normal text-gray-400">(非必填)</span></label>
                                <input
                                    type="text"
                                    value={formData.originalName ?? ''}
                                    onChange={e => setFormData(prev => ({ ...prev, originalName: e.target.value }))}
                                    className="w-full border-2 border-gray-100 rounded-xl shadow-sm focus:border-primary focus:outline-none p-3 font-medium bg-white text-gray-900 text-sm"
                                    placeholder="例如: 2024 Birthday Badge / 2024年バースデー缶バッジ"
                                />
                            </div>
                        </div>

                        {/* Work Select */}
                        <div>
                             <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">所屬作品 <span className="text-secondary-dark">*</span></label>
                             <div className="relative">
                                <select
                                    required
                                    value={formData.workId || ''}
                                    onChange={e => {
                                        const wid = e.target.value;
                                        setFormData({ 
                                            ...formData, 
                                            workId: wid, 
                                            categoryId: '' // Reset cat on work change
                                        });
                                    }}
                                    className="w-full border-2 border-gray-100 rounded-xl shadow-sm focus:border-primary focus:outline-none p-3 appearance-none bg-white font-medium text-gray-900"
                                >
                                    <option value="" disabled>選擇作品</option>
                                    {works.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                                <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">▼</div>
                             </div>
                             {works.length === 0 && <p className="text-xs text-red-400 mt-2 ml-1 font-bold">請先在左側欄位新增作品</p>}
                        </div>

                        {/* Category Select */}
                        <div>
                             <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">分類 <span className="text-secondary-dark">*</span></label>
                             <div className="relative">
                                <select
                                    required
                                    value={formData.categoryId || ''}
                                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                                    disabled={!formData.workId}
                                    className="w-full border-2 border-gray-100 rounded-xl shadow-sm focus:border-primary focus:outline-none p-3 appearance-none bg-white disabled:bg-gray-50 font-medium text-gray-900"
                                >
                                    <option value="" disabled>選擇分類</option>
                                    {formData.workId && works.find(w => w.id === formData.workId)?.categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">▼</div>
                             </div>
                        </div>

                        {/* Price & Quantity */}
                        <div>
                             <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">單價</label>
                             <div className="relative">
                                <span className="absolute left-4 top-3 text-gray-400 font-bold">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.price ?? ''}
                                    onChange={e => handleNumberInput('price', e.target.value)}
                                    className="w-full border-2 border-gray-100 rounded-xl shadow-sm focus:border-primary focus:outline-none p-3 pl-8 font-bold text-gray-900 bg-white"
                                />
                             </div>
                        </div>
                        <div>
                             <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">數量</label>
                             <input
                                type="number"
                                min="1"
                                value={formData.quantity ?? ''}
                                onChange={e => handleNumberInput('quantity', e.target.value)}
                                className="w-full border-2 border-gray-100 rounded-xl shadow-sm focus:border-primary focus:outline-none p-3 font-bold text-gray-900 bg-white"
                             />
                        </div>
                        
                        {/* Status */}
                        <div>
                             <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">物品狀態</label>
                             <div className="relative">
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value as ItemStatus })}
                                    className="w-full border-2 border-gray-100 rounded-xl shadow-sm focus:border-primary focus:outline-none p-3 appearance-none bg-white font-medium text-gray-900"
                                >
                                    {Object.values(ItemStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">▼</div>
                             </div>
                        </div>

                        {/* NEW: Condition Status */}
                        <div>
                             <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">商品狀況</label>
                             <div className="relative">
                                <select
                                    value={formData.condition || ConditionStatus.NEW}
                                    onChange={e => setFormData({ ...formData, condition: e.target.value as ConditionStatus })}
                                    className="w-full border-2 border-gray-100 rounded-xl shadow-sm focus:border-primary focus:outline-none p-3 appearance-none bg-white font-medium text-gray-900"
                                >
                                    {Object.values(ConditionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">▼</div>
                             </div>
                        </div>

                         {/* Payment Status */}
                        <div>
                             <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">付款狀態</label>
                             <div className="relative">
                                <select
                                    value={formData.paymentStatus}
                                    onChange={e => setFormData({ ...formData, paymentStatus: e.target.value as PaymentStatus })}
                                    className="w-full border-2 border-gray-100 rounded-xl shadow-sm focus:border-primary focus:outline-none p-3 appearance-none bg-white font-medium text-gray-900"
                                >
                                    {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">▼</div>
                             </div>
                        </div>
                        
                        {formData.paymentStatus === PaymentStatus.PAID_DEPOSIT && (
                            <div className="col-span-full animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">已付訂金金額</label>
                                <div className="relative">
                                   <span className="absolute left-4 top-3 text-gray-400 font-bold">$</span>
                                   <input
                                       type="number"
                                       min="0"
                                       value={formData.depositAmount ?? ''}
                                       onChange={e => handleNumberInput('depositAmount', e.target.value)}
                                       className="w-full border-2 border-yellow-200 bg-yellow-50 rounded-xl shadow-sm focus:border-primary focus:outline-none p-3 pl-8 font-bold text-gray-900"
                                       placeholder="請輸入訂金金額"
                                   />
                                </div>
                            </div>
                        )}
                        
                        {/* Source Selection Logic */}
                        <div className="col-span-full pt-4 border-t border-dashed border-gray-200">
                             <div className="flex gap-4 mb-4">
                                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition font-bold ${formData.sourceType === SourceType.PROXY ? 'border-secondary bg-secondary/5 text-secondary-dark' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}>
                                    <input 
                                        type="radio" 
                                        name="sourceType" 
                                        className="hidden" 
                                        checked={formData.sourceType === SourceType.PROXY} 
                                        onChange={() => setFormData({...formData, sourceType: SourceType.PROXY})} 
                                    />
                                    <Package size={18} className="pointer-events-none" /> 找代購
                                </label>
                                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition font-bold ${formData.sourceType === SourceType.SELF ? 'border-primary bg-primary/10 text-gray-800' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}>
                                    <input 
                                        type="radio" 
                                        name="sourceType" 
                                        className="hidden" 
                                        checked={formData.sourceType === SourceType.SELF} 
                                        onChange={() => setFormData({...formData, sourceType: SourceType.SELF})} 
                                    />
                                    <MapPin size={18} className="pointer-events-none" /> 自己買
                                </label>
                             </div>
                             
                             {formData.sourceType === SourceType.PROXY ? (
                                 <div>
                                     <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">選擇代購</label>
                                     <div className="relative">
                                        <select
                                            value={formData.proxyId || ''}
                                            onChange={e => setFormData({ ...formData, proxyId: e.target.value })}
                                            className="w-full border-2 border-gray-100 rounded-xl shadow-sm focus:border-secondary focus:outline-none p-3 appearance-none bg-white font-medium text-gray-900"
                                        >
                                            <option value="">-- 請選擇代購 --</option>
                                            {proxies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                        <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">▼</div>
                                     </div>
                                     {proxies.length === 0 && <p className="text-xs text-red-400 mt-2 ml-1">目前無代購資料，請先至代購頁面新增</p>}
                                 </div>
                             ) : (
                                 <div>
                                     <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">購買地點</label>
                                     <input
                                        type="text"
                                        value={formData.purchaseLocation || ''}
                                        onChange={e => setFormData({ ...formData, purchaseLocation: e.target.value })}
                                        className="w-full border-2 border-gray-100 rounded-xl shadow-sm focus:border-primary focus:outline-none p-3 font-medium bg-white text-gray-900"
                                        placeholder="例如: 安利美特、日本現地..."
                                     />
                                 </div>
                             )}
                        </div>
                    </div>
                </form>
                
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4 flex-shrink-0">
                    {editingItem && (
                        <button
                            type="button"
                            onClick={(e) => handleDeleteItem(editingItem.id, e)}
                            className="px-4 py-3 border-2 border-red-100 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 hover:border-red-200 font-bold transition flex items-center justify-center gap-2 cursor-pointer min-w-[80px]"
                            title="刪除此周邊"
                        >
                            <Trash2 size={20} className="pointer-events-none" />
                            <span className="pointer-events-none">刪除</span>
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
    </div>
  );
};
