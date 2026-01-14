import React from 'react';
import { GalleryItem } from '../../types';
import { Book, Layers } from 'lucide-react';
import { useImage } from '../../hooks/useImage';

interface GalleryCardProps {
  item: GalleryItem;
  sortBy: string;
  dragHandlers: any;
  onClick: () => void;
}

export const GalleryCard: React.FC<GalleryCardProps> = ({ item, sortBy, dragHandlers, onClick }) => {
  const { imageUrl } = useImage(item.imageId);

  const totalSpecs = item.specs?.length || 0;
  const ownedSpecs = item.specs?.filter(s => s.isOwned).length || 0;
  const percent = totalSpecs > 0 ? Math.round((ownedSpecs / totalSpecs) * 100) : 0;

  return (
    <div
      data-draggable-id={item.id}
      draggable={sortBy === 'default'}
      onClick={onClick}
      className={`bg-white rounded-xl md:rounded-3xl shadow-sm border border-primary-light overflow-hidden hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group flex flex-col hover:-translate-y-1 cursor-pointer relative ${
        dragHandlers.draggedId === item.id
          ? 'opacity-50 scale-95'
          : dragHandlers.dragOverId === item.id
            ? 'ring-2 ring-secondary scale-105'
            : ''
      }`}
      {...(sortBy === 'default' ? dragHandlers.handlers : {})}
      onDragStart={(e) => sortBy === 'default' && dragHandlers.handlers.onDragStart(e, item.id)}
      onDragOver={(e) => sortBy === 'default' && dragHandlers.handlers.onDragOver(e, item.id)}
      onDrop={(e) => sortBy === 'default' && dragHandlers.handlers.onDrop(e, item.id)}
      onTouchStart={(e) => sortBy === 'default' && dragHandlers.handlers.onTouchStart(e, item.id)}
    >
      <div className="relative aspect-square bg-gray-50 overflow-hidden m-1 md:m-2 rounded-lg md:rounded-2xl">
        {imageUrl ? (
          <img src={imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 z-0" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200">
            <Book size={24} />
          </div>
        )}

        {/* Progress Indicator (Top Right) */}
        {totalSpecs > 0 && (
          <div className="absolute top-1 right-1 md:top-2 md:right-2 flex flex-col gap-1 items-end z-10">
            <div className="px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-full text-[9px] md:text-xs font-bold border shadow-sm backdrop-blur-md bg-white/95 border-primary-light text-gray-600 flex items-center gap-1">
              <Layers size={10} className="md:w-3 md:h-3" />
              {ownedSpecs}/{totalSpecs}
            </div>
          </div>
        )}
      </div>

      <div className="px-2 md:px-5 pb-2 md:pb-5 pt-0.5 md:pt-1 flex flex-col flex-1">
        <h3 className="font-bold text-gray-800 text-[11px] md:text-lg mb-0.5 md:mb-1 truncate leading-tight">{item.name}</h3>

        {totalSpecs > 0 && (
          <div className="mt-auto">
            <div className="bg-gray-100 rounded-full h-1.5 md:h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-secondary to-secondary-dark h-full rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[9px] md:text-xs text-gray-400 font-bold">{percent}% 收集</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
