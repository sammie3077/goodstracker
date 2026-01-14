import React from 'react';
import { GoodsItem, ItemStatus, PaymentStatus, ConditionStatus, SourceType, ProxyService } from '../../types';
import { Package, Tag, MapPin, Edit2, Trash2, Sparkle } from 'lucide-react';
import { useImage } from '../../hooks/useImage';

interface ItemCardProps {
  item: GoodsItem;
  proxies: ProxyService[];
  sortBy: string;
  dragHandlers?: any;
  onEdit: (item: GoodsItem) => void;
  onDelete: (id: string, e?: React.MouseEvent) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  proxies,
  sortBy,
  dragHandlers,
  onEdit,
  onDelete,
}) => {
  // Load image from Blob storage
  const { imageUrl } = useImage(item.imageId);

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

  return (
    <div
      data-draggable-id={item.id}
      draggable={sortBy === 'default'}
      onClick={() => onEdit(item)}
      className={`bg-white rounded-xl md:rounded-3xl shadow-sm border border-primary-light overflow-hidden hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group flex flex-col hover:-translate-y-1 cursor-pointer relative ${
        dragHandlers?.draggedId === item.id
          ? 'opacity-50 scale-95'
          : dragHandlers?.dragOverId === item.id
            ? 'ring-2 ring-secondary scale-105'
            : ''
      }`}
      {...(sortBy === 'default' && dragHandlers ? dragHandlers.handlers : {})}
      onDragStart={(e) => sortBy === 'default' && dragHandlers?.handlers.onDragStart(e, item.id)}
      onDragOver={(e) => sortBy === 'default' && dragHandlers?.handlers.onDragOver(e, item.id)}
      onDrop={(e) => sortBy === 'default' && dragHandlers?.handlers.onDrop(e, item.id)}
      onTouchStart={(e) => sortBy === 'default' && dragHandlers?.handlers.onTouchStart(e, item.id)}
    >
      <div className="relative aspect-square bg-gray-50 overflow-hidden m-1 md:m-2 rounded-lg md:rounded-2xl">
        {imageUrl ? (
          <img src={imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 z-0" />
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
            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
            className="bg-white text-gray-700 p-1.5 md:px-5 md:py-2 rounded-full text-xs font-bold shadow-lg hover:scale-110 transition-transform pointer-events-auto cursor-pointer"
          >
            <Edit2 size={14} className="pointer-events-none"/>
          </button>
          <button
            onClick={(e) => onDelete(item.id, e)}
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
  );
};
