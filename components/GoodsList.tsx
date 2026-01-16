
import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storageService';
import { DB, STORES } from '../services/db';
import { GoodsItem, Work, Category, ItemStatus, PaymentStatus, SourceType, SortOption, ProxyService, ConditionStatus } from '../types';
import { Plus, Filter, ArrowUpDown, Package, X, Settings, Calculator, TrendingUp, Loader2, GripVertical, Library, ChevronRight, Search, Sparkle, Users, Calendar } from 'lucide-react';
import { useLongPressDrag } from '../hooks/useLongPressDrag';
import { useDebounce } from '../hooks/useDebounce';
import { useWorkManagement } from '../hooks/useWorkManagement';
import { toast } from 'sonner';
import { ItemCard } from './GoodsList/ItemCard';
import { ItemForm } from './GoodsList/ItemForm';
import { StatsModal } from './GoodsList/StatsModal';
import { MonthlyStatsModal } from './GoodsList/MonthlyStatsModal';
import { WorkManager } from './GoodsList/WorkManager';
import { ConfirmDialog } from './GoodsList/ConfirmDialog';
import { ImageService } from '../services/imageService';
import { useImageCache } from '../contexts/ImageCacheContext';
import { WorkSidebar } from './shared/WorkSidebar';
import { SearchBar } from './shared/SearchBar';
import { AddWorkModal } from './shared/AddWorkModal';

export const GoodsList: React.FC = () => {
  // Data State
  const [items, setItems] = useState<GoodsItem[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [proxies, setProxies] = useState<ProxyService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Operation Loading States
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Image Cache
  const { preloadImages, getImage } = useImageCache();

  // UI State
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null); // Stores ID (specific work) or Name (all works)
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
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
  const [filterProxySource, setFilterProxySource] = useState<string>('ALL'); // 'ALL' | proxyId | 'SELF' | 'OTHER'

  // Modals
  const [isAddWorkOpen, setIsAddWorkOpen] = useState(false);

  // Stats Modal
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [expandedStatWorkId, setExpandedStatWorkId] = useState<string | null>(null);

  // Monthly Stats Modal
  const [isMonthlyStatsOpen, setIsMonthlyStatsOpen] = useState(false);
  
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

    // Preload all images in batch for better performance
    const imageIds = fetchedItems.map(item => item.imageId).filter(Boolean);
    if (imageIds.length > 0) {
      preloadImages(imageIds).catch(error => {
        console.error('Failed to preload images:', error);
      });
    }

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

    // 4. Filter by Proxy Source
    if (filterProxySource !== 'ALL') {
      if (filterProxySource === 'SELF') {
        // 篩選自購的周邊
        result = result.filter(i => i.sourceType === SourceType.SELF);
      } else if (filterProxySource === 'OTHER') {
        // 篩選代購但沒有填寫 proxyId 的周邊
        result = result.filter(i => i.sourceType === SourceType.PROXY && !i.proxyId);
      } else {
        // 篩選特定代購的周邊
        result = result.filter(i => i.sourceType === SourceType.PROXY && i.proxyId === filterProxySource);
      }
    }

    // 5. Search Query (Name or Original Name)
    if (debouncedSearchQuery.trim()) {
        const query = debouncedSearchQuery.toLowerCase();
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
  }, [items, selectedWorkId, selectedCategoryId, sortBy, filterStatus, filterProxySource, debouncedSearchQuery, works]);

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

  const handleCreateWork = async (workName: string) => {
    if (!workName.trim()) {
      toast.error('請填寫作品名稱');
      return;
    }
    const work = await StorageService.addWork(workName);
    setSelectedWorkId(work.id);
    setIsAddWorkOpen(false);
    refreshData();
    toast.success(`已新增作品「${work.name}」`);
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
    if (!editWorkName.trim()) {
      toast.error('作品名稱不能為空');
      return;
    }
    if (!selectedWorkId) return;

    await StorageService.updateWork(selectedWorkId, editWorkName);
    refreshData();
    toast.success('作品名稱已更新');
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
            setIsDeleting(true);
            try {
                await StorageService.deleteWork(selectedWorkId);
                setSelectedWorkId(null);
                setSelectedCategoryId(null);
                setIsManagerOpen(false);
                refreshData();
                toast.success('作品已刪除');
            } catch (e) {
                toast.error('刪除失敗');
                console.error(e);
            } finally {
                setIsDeleting(false);
                setConfirmConfig(null);
            }
        }
    });
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('分類名稱不能為空');
      return;
    }
    if (!selectedWorkId) return;

    await StorageService.addCategoryToWork(selectedWorkId, newCategoryName);
    setNewCategoryName('');
    refreshData();
    toast.success(`已新增分類「${newCategoryName}」`);
  };

  const handleUpdateCategory = async (catId: string) => {
    if (!editingCatName.trim()) {
      toast.error('分類名稱不能為空');
      return;
    }
    if (!selectedWorkId) return;

    await StorageService.updateCategory(selectedWorkId, catId, editingCatName);
    setEditingCatId(null);
    refreshData();
    toast.success('分類名稱已更新');
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

  const openForm = async (item?: GoodsItem) => {
    if (item) {
      setEditingItem(item);

      // Load image as base64 for editing
      let imageBase64: string | undefined;
      if (item.imageId) {
        imageBase64 = await ImageService.getImageAsBase64(item.imageId) || undefined;
      }

      setFormData({
        ...item,
        image: imageBase64 // Load image for ImageCropper
      });
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

    // Detailed validation with specific error messages
    if (!formData.name?.trim()) {
      toast.error('請填寫品項名稱');
      return;
    }
    if (!formData.workId) {
      toast.error('請選擇所屬作品');
      return;
    }
    if (!formData.categoryId) {
      toast.error('請選擇分類');
      return;
    }
    if (formData.price === undefined || formData.price < 0) {
      toast.error('請填寫有效的價格');
      return;
    }
    if (formData.quantity === undefined || formData.quantity < 1) {
      toast.error('數量必須至少為 1');
      return;
    }
    if (formData.paymentStatus === PaymentStatus.PAID_DEPOSIT) {
      if (!formData.depositAmount || formData.depositAmount <= 0) {
        toast.error('已匯訂金時，請填寫訂金金額');
        return;
      }
      const totalPrice = (formData.price || 0) * (formData.quantity || 1);
      if (formData.depositAmount >= totalPrice) {
        toast.error('訂金金額不能大於或等於總價');
        return;
      }
    }

    setIsSaving(true);
    try {
      // Handle image storage
      let imageId = formData.imageId;

      // If there's a new base64 image, save it as Blob
      if (formData.image) {
        // Update image (delete old, save new)
        imageId = await ImageService.updateImage(editingItem?.imageId, formData.image);
      }

      const payload = {
        ...formData,
        id: editingItem?.id || crypto.randomUUID(),
        imageId, // Store the image ID
        image: undefined, // Don't store base64 anymore
        // Ensure numerical values are numbers, default to 0 if empty
        price: Number(formData.price || 0),
        quantity: Number(formData.quantity || 0),
        depositAmount: formData.depositAmount ? Number(formData.depositAmount) : undefined,
      } as GoodsItem;

      if (editingItem) {
        await StorageService.updateItem(payload);
        toast.success('周邊已更新');
      } else {
        await StorageService.addItem(payload);
        toast.success('周邊已新增');
      }
      setIsFormOpen(false);
      refreshData();
    } catch (error: any) {
        console.error(error);

        // Handle quota exceeded error with friendly message
        if (error.name === 'QuotaExceededError') {
          toast.error(error.message || '儲存空間不足，請刪除一些舊圖片');
        } else {
          toast.error('儲存失敗');
        }
    } finally {
      setIsSaving(false);
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
              setIsDeleting(true);
              try {
                await StorageService.deleteItem(id);
                // If we are currently editing this item (e.g. from modal), close modal
                if (editingItem?.id === id) {
                    setIsFormOpen(false);
                    setEditingItem(null);
                }
                refreshData();
                toast.success('周邊已刪除');
              } catch (error) {
                console.error(error);
                toast.error('刪除失敗');
              } finally {
                setIsDeleting(false);
                setConfirmConfig(null);
              }
          }
      });
  };

  // --- Render Helpers ---

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
        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-white to-white/90 backdrop-blur-sm border-t border-primary-light space-y-2">
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

           <button
             onClick={() => setIsMonthlyStatsOpen(true)}
             className="w-full bg-primary/10 hover:bg-primary/20 text-primary-dark rounded-xl p-3 flex items-center justify-between group transition-colors cursor-pointer"
           >
              <div className="flex items-center gap-2 pointer-events-none">
                 <div className="p-1.5 bg-white rounded-full text-primary shadow-sm">
                    <Calendar size={16} />
                 </div>
                 <div className="text-left">
                    <span className="font-bold text-xs block opacity-70">月度支出統計</span>
                    <span className="font-black text-sm">查看每月支出</span>
                 </div>
              </div>
              <ChevronRight size={16} className="text-primary/50 group-hover:text-primary pointer-events-none" />
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
             <div className="md:hidden w-full">
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="搜尋名稱..."
                />
            </div>

             <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 md:ml-auto w-full md:w-auto">
                {/* Desktop Search Bar */}
                <div className="hidden md:block w-48 lg:w-64">
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="搜尋名稱..."
                    />
                </div>

                {/* Mobile Stats Buttons */}
                <button
                    onClick={() => setIsStatsOpen(true)}
                    className="md:hidden shrink-0 bg-white border-2 border-primary-light text-secondary-dark p-2 rounded-full shadow-sm cursor-pointer"
                    title="資產統計"
                >
                    <Calculator size={18} className="pointer-events-none" />
                </button>
                <button
                    onClick={() => setIsMonthlyStatsOpen(true)}
                    className="md:hidden shrink-0 bg-white border-2 border-primary-light text-primary-dark p-2 rounded-full shadow-sm cursor-pointer"
                    title="月度統計"
                >
                    <Calendar size={18} className="pointer-events-none" />
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
                        value={filterProxySource}
                        onChange={(e) => setFilterProxySource(e.target.value)}
                        className="appearance-none bg-white border-2 border-primary-light text-xs md:text-sm rounded-full pl-8 pr-6 py-2 focus:outline-none focus:border-primary text-gray-700 cursor-pointer shadow-sm hover:border-primary/50 transition-colors font-medium"
                    >
                        <option value="ALL">所有來源</option>
                        <option value="SELF">自購</option>
                        <option value="OTHER">其他</option>
                        {proxies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <Users className="absolute left-2.5 top-2.5 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
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
                    <ItemCard
                        key={item.id}
                        item={item}
                        proxies={proxies}
                        sortBy={sortBy}
                        dragHandlers={goodsDrag}
                        cachedImageUrl={getImage(item.imageId)}
                        onEdit={openForm}
                        onDelete={handleDeleteItem}
                    />
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
      <AddWorkModal
        isOpen={isAddWorkOpen}
        onClose={() => setIsAddWorkOpen(false)}
        onSubmit={handleCreateWork}
      />

      {/* 2. Manager Modal */}
      <WorkManager
        isOpen={isManagerOpen}
        currentWork={currentWork || null}
        sortedCategories={sortedCategories}
        categoriesDragHandlers={categoriesDrag}
        onClose={() => setIsManagerOpen(false)}
        onUpdateWorkName={async (name) => {
          if (selectedWorkId && name.trim()) {
            await StorageService.updateWork(selectedWorkId, name);
            refreshData();
            toast.success('作品名稱已更新');
          }
        }}
        onDeleteWork={handleDeleteWork}
        onAddCategory={async (name) => {
          if (selectedWorkId && name.trim()) {
            await StorageService.addCategoryToWork(selectedWorkId, name);
            refreshData();
          }
        }}
        onUpdateCategory={async (catId, name) => {
          if (selectedWorkId && name.trim()) {
            await StorageService.updateCategory(selectedWorkId, catId, name);
            refreshData();
          }
        }}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* 4. Statistics Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        statistics={statistics}
        onClose={() => setIsStatsOpen(false)}
      />

      {/* 5. Monthly Statistics Modal */}
      <MonthlyStatsModal
        isOpen={isMonthlyStatsOpen}
        items={items}
        onClose={() => setIsMonthlyStatsOpen(false)}
      />

      {/* 6. Item Form Modal */}
      <ItemForm
        isOpen={isFormOpen}
        editingItem={editingItem}
        formData={formData}
        works={works}
        proxies={proxies}
        isSaving={isSaving}
        isDeleting={isDeleting}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        onDelete={handleDeleteItem}
        onFormDataChange={setFormData}
      />

      {/* 7. Custom Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirmConfig}
        title={confirmConfig?.title || ''}
        message={confirmConfig?.message || ''}
        isDangerous={confirmConfig?.isDangerous}
        onCancel={() => setConfirmConfig(null)}
        onConfirm={() => {
          confirmConfig?.onConfirm();
        }}
      />
    </div>
  );
};
