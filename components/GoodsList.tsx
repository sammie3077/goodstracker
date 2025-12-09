
import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storageService';
import { DB, STORES } from '../services/db';
import { GoodsItem, Work, Category, ItemStatus, PaymentStatus, SourceType, SortOption, ProxyService, ConditionStatus } from '../types';
import { Plus, Search, Filter, ArrowUpDown, Tag, MapPin, DollarSign, Package, Trash2, X, Settings, Edit2, Check, AlertTriangle, Calculator, ChevronDown, ChevronRight, TrendingUp, Sparkle, Library, Loader2, CircleDollarSign, GripVertical } from 'lucide-react';
import { ImageCropper } from './ImageCropper';
import { useLongPressDrag } from '../hooks/useLongPressDrag';

export const GoodsList: React.FC = () => {
  // Data State
  const [items, setItems] = useState<GoodsItem[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [proxies, setProxies] = useState<ProxyService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI State
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null); // Stores ID (specific work) or Name (all works)
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GoodsItem | null>(null);
  
  // Confirm Dialog State
  const [confirmConfig, setConfirmConfig] = useState<{
      isOpen: boolean;
      title: string;
      message: React.ReactNode;
      onConfirm: () => void;
      isDangerous?: boolean;
  } | null>(null);
  
  // Filters & Sort
  const [sortBy, setSortBy] = useState<SortOption>('default');
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

  const refreshData = async () => {
    setIsLoading(true);
    const [fetchedItems, fetchedWorks, fetchedProxies] = await Promise.all([
        StorageService.getItems(),
        StorageService.getWorks(),
        StorageService.getProxies()
    ]);
    setItems(fetchedItems);
    setWorks(fetchedWorks);
    setProxies(fetchedProxies);
    setIsLoading(false);
  };

  // --- Computed ---

  // Helper to get category name from an item
  const getItemCategoryName = (item: GoodsItem) => {
      const work = works.find(w => w.id === item.workId);
      const cat = work?.categories.find(c => c.id === item.categoryId);
      return cat?.name;
  };

  // Get available categories based on view (Specific Work vs All Works)
  const visibleCategories = useMemo(() => {
      if (selectedWorkId) {
          // Return categories for the specific work
          return works.find(w => w.id === selectedWorkId)?.categories || [];
      } else {
          // Return unique category names across all works
          const uniqueNames = new Set<string>();
          works.forEach(w => w.categories.forEach(c => uniqueNames.add(c.name)));
          // Map to a structure similar to Category interface for consistent rendering
          // We use the name itself as the ID for "All Works" mode
          return Array.from(uniqueNames).map(name => ({ id: name, name }));
      }
  }, [works, selectedWorkId]);

  const filteredItems = useMemo(() => {
    let result = items;

    // 1. Filter by Work
    if (selectedWorkId) {
      result = result.filter(i => i.workId === selectedWorkId);
    }

    // 2. Filter by Category
    if (selectedCategoryId) {
        if (selectedWorkId) {
            // In specific work view: match exact Category ID
            result = result.filter(i => i.categoryId === selectedCategoryId);
        } else {
            // In All Works view: match Category Name
            // selectedCategoryId holds the Name in this mode
            result = result.filter(i => getItemCategoryName(i) === selectedCategoryId);
        }
    }

    // 3. Filter by Status
    if (filterStatus !== 'ALL') {
      result = result.filter(i => i.status === filterStatus);
    }

    // 4. Search Query (Name or Original Name)
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        result = result.filter(i =>
            i.name.toLowerCase().includes(query) ||
            (i.originalName && i.originalName.toLowerCase().includes(query))
        );
    }

    // 5. Sort
    return result.sort((a, b) => {
      switch (sortBy) {
        case 'default': {
          // Use manual order if available, otherwise fall back to created date
          const orderA = a.order ?? Infinity;
          const orderB = b.order ?? Infinity;
          if (orderA !== orderB && orderA !== Infinity && orderB !== Infinity) {
            return orderA - orderB;
          }
          return b.createdAt - a.createdAt;
        }
        case 'price_desc': return b.price - a.price;
        case 'price_asc': return a.price - b.price;
        case 'quantity_desc': return b.quantity - a.quantity;
        case 'quantity_asc': return a.quantity - b.quantity;
        case 'total_desc': return (b.price * b.quantity) - (a.price * a.quantity);
        case 'total_asc': return (a.price * a.quantity) - (b.price * b.quantity);
        case 'created_asc': return a.createdAt - b.createdAt;
        case 'created_desc': return b.createdAt - a.createdAt;
        default: return b.createdAt - a.createdAt;
      }
    });
  }, [items, selectedWorkId, selectedCategoryId, sortBy, filterStatus, searchQuery, works]);

  // Calculate Total Value for Current View
  const currentViewTotal = useMemo(() => {
      return filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [filteredItems]);

  // Statistics Calculation
  const statistics = useMemo(() => {
      const grandTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Calculate Unpaid Amount (Calculated across ALL items, not just filtered)
      const unpaidTotal = items.reduce((sum, item) => {
          const totalItemPrice = item.price * item.quantity;
          
          if (item.paymentStatus === PaymentStatus.COD) {
              // Cash on Delivery: Whole amount is unpaid
              return sum + totalItemPrice;
          } else if (item.paymentStatus === PaymentStatus.PAID_DEPOSIT) {
              // Paid Deposit: Total - Deposit is unpaid
              const deposit = item.depositAmount || 0;
              return sum + Math.max(0, totalItemPrice - deposit);
          }
          return sum;
      }, 0);

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
      }).sort((a, b) => b.total - a.total);

      return { grandTotal, unpaidTotal, workStats };
  }, [items, works]);

  const currentWork = works.find(w => w.id === selectedWorkId);

  // Sort works by order
  const sortedWorks = useMemo(() => {
    return [...works].sort((a, b) => {
      const orderA = a.order ?? Infinity;
      const orderB = b.order ?? Infinity;
      if (orderA === orderB) return a.name.localeCompare(b.name);
      return orderA - orderB;
    });
  }, [works]);

  // Handle work reorder
  const handleWorkReorder = async (reorderedWorks: Work[]) => {
    const worksWithOrder = reorderedWorks.map((work, index) => ({
      ...work,
      order: index,
    }));
    await StorageService.bulkUpdateWorks(worksWithOrder);
    refreshData();
  };

  // Drag handlers for works
  const worksDrag = useLongPressDrag({
    items: sortedWorks,
    onReorder: handleWorkReorder,
  });

  // Sort categories by order
  const sortedCategories = useMemo(() => {
    if (!currentWork) return [];
    return [...currentWork.categories].sort((a, b) => {
      const orderA = a.order ?? Infinity;
      const orderB = b.order ?? Infinity;
      if (orderA === orderB) return a.name.localeCompare(b.name);
      return orderA - orderB;
    });
  }, [currentWork]);

  // Handle category reorder
  const handleCategoryReorder = async (reorderedCategories: Category[]) => {
    if (!selectedWorkId || !currentWork) return;
    const categoriesWithOrder = reorderedCategories.map((cat, index) => ({
      ...cat,
      order: index,
    }));
    const updatedWork = {
      ...currentWork,
      categories: categoriesWithOrder,
    };
    await StorageService.updateWork(selectedWorkId, updatedWork.name);
    await DB.put(STORES.WORKS, updatedWork);
    refreshData();
  };

  // Drag handlers for categories
  const categoriesDrag = useLongPressDrag({
    items: sortedCategories,
    onReorder: handleCategoryReorder,
  });

  // Handle goods items reorder
  const handleGoodsReorder = async (reorderedItems: GoodsItem[]) => {
    const itemsWithOrder = reorderedItems.map((item, index) => ({
      ...item,
      order: index,
    }));
    await StorageService.bulkUpdateItems(itemsWithOrder);
    refreshData();
  };

  // Drag handlers for goods items
  const goodsDrag = useLongPressDrag({
    items: filteredItems,
    onReorder: handleGoodsReorder,
    // Only enable drag in default sorting mode
    disabled: sortBy !== 'default',
  });

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
      setNewCategoryName('');
      setEditingCatId(null);
      setManagerTab('categories');
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
                <span className="text-red-500 font-bold">注意：該作品底下的【所有周邊】也會一併被刪除！</span><br/>
                此動作無法復原。
            </span>
        ),
        isDangerous: true,
        onConfirm: async () => {
            try {
                await StorageService.deleteWork(selectedWorkId);
                setSelectedWorkId(null);
                setSelectedCategoryId(null);
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

  const handleAddCategory = async () => {
    if (selectedWorkId && newCategoryName.trim()) {
      await StorageService.addCategoryToWork(selectedWorkId, newCategoryName);
      setNewCategoryName('');
      refreshData();
    }
  };

  const handleUpdateCategory = async (catId: string) => {
    if (selectedWorkId && editingCatName.trim()) {
      await StorageService.updateCategory(selectedWorkId, catId, editingCatName);
      setEditingCatId(null);
      refreshData();
    }
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
      if (!selectedWorkId) return;
      
      setConfirmConfig({
          isOpen: true,
          title: '刪除分類',
          message: `確定要刪除分類「${catName}」嗎？\n該分類下的周邊也會一併刪除。`,
          isDangerous: true,
          onConfirm: async () => {
            await StorageService.deleteCategory(selectedWorkId, catId);
            if (selectedCategoryId === catId) {
                setSelectedCategoryId(null);
            }
            refreshData();
            setConfirmConfig(null);
          }
      });
  };

  const openForm = (item?: GoodsItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
    } else {
      setEditingItem(null);
      setFormData({
        workId: selectedWorkId || (works.length > 0 ? works[0].id : ''),
        categoryId: selectedCategoryId && selectedWorkId ? selectedCategoryId : '', // Only pre-fill if in specific work mode
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

  const handleFormSubmit = async (e: React.FormEvent) => {
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
          await StorageService.updateItem(payload);
        } else {
          await StorageService.addItem(payload);
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
          title: '刪除周邊',
          message: '確定要刪除這個周邊嗎？此動作無法復原。',
          isDangerous: true,
          onConfirm: async () => {
              await StorageService.deleteItem(id);
              // If we are currently editing this item (e.g. from modal), close modal
              if (editingItem?.id === id) {
                  setIsFormOpen(false);
                  setEditingItem(null);
              }
              refreshData();
              setConfirmConfig(null);
          }
      });
  };

  // --- Render Helpers ---

  // Use Theme Colors instead of hardcoded colors
  const getStatusColor = (status: ItemStatus) => {
    switch (status) {
      case ItemStatus.ARRIVED: return 'bg-secondary/10 text-secondary-dark border-secondary/20';
      case ItemStatus.PREORDER: return 'bg-primary/20 text-gray-800 border-primary/30';
      case ItemStatus.NOT_ON_HAND: return 'bg-gray-100 text-gray-600 border-gray-200';
      case ItemStatus.FOR_SALE: return 'bg-white border-dashed border-gray-300 text-gray-500';
      default: return 'bg-gray-100';
    }
  };

  // Use Theme Colors
  const getConditionColor = (cond?: ConditionStatus) => {
      if (cond === ConditionStatus.OPENED) return 'bg-gray-100 text-gray-500 border-gray-200';
      if (cond === ConditionStatus.CHECKED) return 'bg-primary/20 text-gray-800 border-primary/30';
      // Default NEW
      return 'bg-secondary/10 text-secondary-dark border-secondary/20'; 
  };

  // Payment Status Colors (Themed)
  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID_FULL: return 'bg-secondary/10 text-secondary-dark border-secondary/20';
      case PaymentStatus.PAID_DEPOSIT: return 'bg-primary/30 text-gray-900 border-primary/40';
      case PaymentStatus.COD: return 'bg-gray-100 text-gray-500 border-gray-200';
      case PaymentStatus.FORGOTTEN: return 'bg-gray-200 text-gray-600 border-gray-300';
      default: return 'bg-gray-100 text-gray-400';
    }
  };

  // Safe Input Handler for Numbers
  const handleNumberInput = (field: keyof GoodsItem, val: string) => {
      setFormData({
          ...formData,
          [field]: val === '' ? ('' as any) : Number(val)
      });
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
            onClick={() => { setSelectedWorkId(null); setSelectedCategoryId(null); }}
            className={`w-full text-left px-5 py-3 text-sm transition font-bold border-l-4 hover:bg-primary-light/50 ${!selectedWorkId ? 'border-primary bg-primary-light/50 text-gray-900' : 'border-transparent text-gray-500'}`}
          >
            全部作品
          </button>
          {sortedWorks.map(work => (
            <div
              key={work.id}
              className="relative group"
              data-draggable-id={work.id}
              draggable
              {...worksDrag.handlers}
              onDragStart={(e) => worksDrag.handlers.onDragStart(e, work.id)}
              onDragOver={(e) => worksDrag.handlers.onDragOver(e, work.id)}
              onDrop={(e) => worksDrag.handlers.onDrop(e, work.id)}
              onTouchStart={(e) => worksDrag.handlers.onTouchStart(e, work.id)}
            >
                <button
                  onClick={() => { setSelectedWorkId(work.id); setSelectedCategoryId(null); }}
                  className={`w-full text-left px-5 py-3 text-sm transition font-bold truncate border-l-4 hover:bg-primary-light/50 flex items-center gap-2 ${
                    worksDrag.draggedId === work.id
                      ? 'opacity-50 bg-gray-100'
                      : worksDrag.dragOverId === work.id
                        ? 'border-secondary bg-secondary/10'
                        : selectedWorkId === work.id
                          ? 'border-primary bg-primary-light/50 text-gray-900'
                          : 'border-transparent text-gray-500'
                  }`}
                >
                  <GripVertical size={16} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  <span className="truncate">{work.name}</span>
                </button>
            </div>
          ))}
        </div>
        
        {/* Desktop Total Summary in Sidebar */}
        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-white to-white/90 backdrop-blur-sm border-t border-primary-light">
           <button 
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
        <header className="bg-background p-4 border-b border-primary-light flex flex-col gap-3 z-30 shadow-sm flex-shrink-0 transition-colors duration-500">
            {/* Mobile Work Selector */}
            <div className="md:hidden flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar border-b border-primary-light/50">
                 <button onClick={() => setIsAddWorkOpen(true)} className="flex-shrink-0 p-2 bg-primary-light text-primary-dark rounded-full shadow-sm cursor-pointer">
                    <Plus size={16} className="pointer-events-none" />
                 </button>
                 <button
                    onClick={() => { setSelectedWorkId(null); setSelectedCategoryId(null); }}
                    className={`whitespace-nowrap px-2 py-2 text-sm font-bold transition border-b-2 ${!selectedWorkId ? 'border-primary text-gray-900' : 'border-transparent text-gray-500'}`}
                 >
                    全部作品
                 </button>
                 {sortedWorks.map(w => (
                     <button
                        key={w.id}
                        onClick={() => { setSelectedWorkId(w.id); setSelectedCategoryId(null); }}
                        className={`whitespace-nowrap px-2 py-2 text-sm font-bold transition border-b-2 ${selectedWorkId === w.id ? 'border-primary text-gray-900' : 'border-transparent text-gray-500'}`}
                     >
                        {w.name}
                     </button>
                 ))}
            </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
             {/* Categories (Tabs) & Title */}
             <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:max-w-xl pb-1">
                 {/* Title (Only when no work selected, or on Mobile where work is selected above) */}
                 {!selectedWorkId && (
                     <div className="flex-shrink-0 text-lg font-black text-gray-800 tracking-tight flex items-center gap-2 mr-2">
                        <Sparkle size={20} className="text-primary-dark" /> 周邊一覽
                     </div>
                 )}

                 {/* Settings & Add Buttons (Only when Work is Selected) */}
                 {selectedWorkId && currentWork && (
                     <button 
                         onClick={openManager}
                         className="flex-shrink-0 p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full mr-2 transition-colors cursor-pointer"
                         title="管理作品與分類"
                     >
                         <Settings size={18} className="pointer-events-none" />
                     </button>
                 )}

                {/* Categories Tabs */}
                <button
                    onClick={() => setSelectedCategoryId(null)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border-2 transition ${
                        !selectedCategoryId 
                            ? 'bg-primary text-gray-900 border-primary shadow-md shadow-primary/20' 
                            : 'bg-white text-gray-600 border-primary-light hover:border-primary/50'
                    }`}
                >
                    全部分類
                </button>
                {visibleCategories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border-2 transition ${selectedCategoryId === cat.id ? 'bg-primary text-gray-900 border-primary shadow-md shadow-primary/20' : 'bg-white text-gray-600 border-primary-light hover:border-primary/50'}`}
                    >
                        {cat.name}
                    </button>
                ))}
                
                {selectedWorkId && (
                    <button onClick={openManager} className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs text-gray-400 border-2 border-dashed border-gray-300 hover:bg-primary-light hover:border-primary hover:text-primary-dark flex items-center gap-1 font-bold cursor-pointer">
                        <Plus size={14} className="pointer-events-none" /> 編輯
                    </button>
                )}
             </div>

             {/* Mobile Search Bar (Moved Here - After Categories) */}
             <div className="md:hidden w-full relative">
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜尋名稱..."
                    className="w-full pl-9 pr-4 py-2 bg-white border-2 border-primary-light rounded-full text-sm focus:outline-none focus:border-primary text-gray-800 shadow-sm"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4 pointer-events-none" />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                        <X size={14} />
                    </button>
                )}
            </div>

             <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 md:ml-auto w-full md:w-auto">
                {/* Desktop Search Bar */}
                <div className="hidden md:block relative w-48 lg:w-64 transition-all focus-within:w-64">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="搜尋名稱..."
                        className="w-full pl-9 pr-4 py-2 bg-white border-2 border-primary-light rounded-full text-sm focus:outline-none focus:border-primary text-gray-800 shadow-sm"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4 pointer-events-none" />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Mobile Stats Button (View Detailed Breakdown) */}
                <button 
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
                        <option value="default">預設排序</option>
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
                        data-draggable-id={item.id}
                        draggable={sortBy === 'default'}
                        onClick={() => openForm(item)}
                        className={`bg-white rounded-xl md:rounded-3xl shadow-sm border border-primary-light overflow-hidden hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group flex flex-col hover:-translate-y-1 cursor-pointer relative ${
                          goodsDrag.draggedId === item.id
                            ? 'opacity-50 scale-95'
                            : goodsDrag.dragOverId === item.id
                              ? 'ring-2 ring-secondary scale-105'
                              : ''
                        }`}
                        {...(sortBy === 'default' ? goodsDrag.handlers : {})}
                        onDragStart={(e) => sortBy === 'default' && goodsDrag.handlers.onDragStart(e, item.id)}
                        onDragOver={(e) => sortBy === 'default' && goodsDrag.handlers.onDragOver(e, item.id)}
                        onDrop={(e) => sortBy === 'default' && goodsDrag.handlers.onDrop(e, item.id)}
                        onTouchStart={(e) => sortBy === 'default' && goodsDrag.handlers.onTouchStart(e, item.id)}
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

                            {/* Condition Tag (Top Left) */}
                            <div className="absolute top-1 left-1 md:top-2 md:left-2 flex flex-col gap-1 items-start z-10">
                                <span className={`px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-md text-[8px] md:text-[10px] font-bold border shadow-sm backdrop-blur-md bg-white/95 flex items-center gap-0.5 ${getConditionColor(item.condition)}`}>
                                    {item.condition === ConditionStatus.NEW && <Sparkle size={8} className="md:w-3 md:h-3" />}
                                    {item.condition || ConditionStatus.NEW}
                                </span>
                            </div>

                            {/* Hover Edit/Delete Overlay - Visible on Desktop Hover */}
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
                                        <span className="text-[9px] md:text-xs px-1 md:px-2 py-0.5 rounded-md bg-primary/10 text-primary-dark border border-primary/20 block w-fit md:ml-auto font-medium truncate max-w-full scale-90 md:scale-100 origin-left">
                                            訂金 ${item.depositAmount}
                                        </span>
                                    )}
                                    <span className={`text-[9px] md:text-xs px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md border block w-fit md:ml-auto font-bold truncate max-w-full scale-90 md:scale-100 origin-left ${getPaymentStatusColor(item.paymentStatus)}`}>
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
                    <button onClick={() => openForm()} className="mt-4 text-gray-600 bg-primary/20 px-4 py-2 rounded-full text-sm font-bold hover:bg-primary/40 transition">新增第一筆資料？</button>
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

      {/* 2. Manager Modal */}
      {isManagerOpen && currentWork && (
          <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl border-4 border-white flex flex-col max-h-[85vh] overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-primary-light/30">
                      <h3 className="font-black text-lg text-gray-700 flex items-center gap-2">
                        <Settings size={20} className="text-gray-400" />
                        管理：{currentWork.name}
                      </h3>
                      <button onClick={() => setIsManagerOpen(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 flex items-center justify-center transition-colors">
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
                                          categoriesDrag.draggedId === cat.id
                                            ? 'opacity-50 bg-gray-100'
                                            : categoriesDrag.dragOverId === cat.id
                                              ? 'border-secondary bg-secondary/10'
                                              : ''
                                        }`}
                                        data-draggable-id={cat.id}
                                        draggable
                                        {...categoriesDrag.handlers}
                                        onDragStart={(e) => categoriesDrag.handlers.onDragStart(e, cat.id)}
                                        onDragOver={(e) => categoriesDrag.handlers.onDragOver(e, cat.id)}
                                        onDrop={(e) => categoriesDrag.handlers.onDrop(e, cat.id)}
                                        onTouchStart={(e) => categoriesDrag.handlers.onTouchStart(e, cat.id)}
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
                                                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
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

      {/* 4. Statistics Modal */}
      {isStatsOpen && (
          <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl border-4 border-white flex flex-col max-h-[85vh] overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 bg-primary-light/30 flex justify-between items-center flex-shrink-0">
                      <div>
                          <h3 className="font-black text-xl text-gray-800 flex items-center gap-2">
                             <TrendingUp size={24} className="text-secondary-dark" />
                             資產統計
                          </h3>
                          <p className="text-xs text-gray-500 font-bold mt-1">目前所有收藏的總價值與待補款</p>
                      </div>
                      <button onClick={() => setIsStatsOpen(false)} className="w-8 h-8 rounded-full bg-white text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm cursor-pointer">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="overflow-y-auto custom-scrollbar flex-1 bg-white p-6">
                      {/* Grand Total Card */}
                      <div className="bg-gradient-to-br from-secondary to-secondary-dark rounded-3xl p-6 text-white shadow-lg shadow-secondary/20 mb-4 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                          <p className="text-white font-bold mb-1 opacity-80">總資產估值 (Grand Total)</p>
                          <h2 className="text-4xl font-black tracking-tight">${statistics.grandTotal.toLocaleString()}</h2>
                      </div>

                      {/* Unpaid Amount Card */}
                      <div className="bg-secondary/5 border-2 border-secondary/20 rounded-3xl p-5 mb-8 flex items-center justify-between">
                         <div>
                            <p className="text-secondary-dark font-bold text-sm mb-1 flex items-center gap-1">
                                <CircleDollarSign size={16} /> 預估待補款 (Unpaid)
                            </p>
                            <h3 className="text-2xl font-black text-secondary-dark">${statistics.unpaidTotal.toLocaleString()}</h3>
                         </div>
                         <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center text-secondary-dark">
                            <Calculator size={20} />
                         </div>
                      </div>

                      <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                          <Package size={18} /> 作品排行
                      </h4>
                      
                      <div className="space-y-3">
                          {statistics.workStats.map((stat) => (
                              <div key={stat.id} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                  <button 
                                    onClick={() => setExpandedStatWorkId(expandedStatWorkId === stat.id ? null : stat.id)}
                                    className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
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

      {/* 3. Item Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl my-8 overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border-4 border-white">
                <div className="px-8 py-5 border-b border-gray-100 bg-white flex justify-between items-center flex-shrink-0">
                    <h3 className="font-black text-xl text-gray-800 flex items-center gap-2">
                        {editingItem ? <Edit2 size={24} className="text-primary-dark"/> : <Sparkle size={24} className="text-primary-dark"/>}
                        {editingItem ? ' 編輯周邊' : ' 新增周邊'}
                    </h3>
                    <button onClick={() => setIsFormOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer">✕</button>
                </div>
                
                <form onSubmit={handleFormSubmit} className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                    {/* Image Section */}
                    <div className="flex justify-center">
                        <div className="w-full max-w-xs">
                             <ImageCropper 
                                key={editingItem ? editingItem.id : 'new-item'}
                                initialImage={formData.image} 
                                onImageCropped={(base64) => setFormData(prev => ({ ...prev, image: base64 }))} 
                             />
                             <p className="text-xs text-center text-gray-400 mt-3 font-medium">支援上傳後裁切為正方形</p>
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
                                    value={formData.originalName || ''}
                                    onChange={e => setFormData({ ...formData, originalName: e.target.value })}
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

                        {/* Condition Status */}
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
                            className="px-4 py-3 border-2 border-red-100 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 hover:border-red-200 font-bold transition flex items-center justify-center cursor-pointer"
                            title="刪除此周邊"
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

      {/* 5. Custom Confirm Dialog */}
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
