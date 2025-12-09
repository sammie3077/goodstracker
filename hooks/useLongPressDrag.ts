import { useState, useRef, useCallback, useEffect } from 'react';

interface UseLongPressDragOptions<T> {
  items: T[];
  onReorder: (reorderedItems: T[]) => void;
  longPressDelay?: number;
  disabled?: boolean;
}

export function useLongPressDrag<T extends { id: string }>({
  items,
  onReorder,
  longPressDelay = 500,
  disabled = false,
}: UseLongPressDragOptions<T>) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  // Clear long press timer
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Handle drag start (desktop)
  const handleDragStart = useCallback((e: React.DragEvent, itemId: string) => {
    if (disabled) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', itemId);
    setDraggedId(itemId);
    isDraggingRef.current = true;
  }, [disabled]);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent, itemId: string) => {
    if (disabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (itemId !== draggedId) {
      setDragOverId(itemId);
    }
  }, [disabled, draggedId]);

  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    if (disabled) return;
    e.preventDefault();

    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      isDraggingRef.current = false;
      return;
    }

    const draggedIndex = items.findIndex(item => item.id === draggedId);
    const targetIndex = items.findIndex(item => item.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const reordered = [...items];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    onReorder(reordered);
    setDraggedId(null);
    setDragOverId(null);
    isDraggingRef.current = false;
  }, [disabled, draggedId, items, onReorder]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
    isDraggingRef.current = false;
  }, []);

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent, itemId: string) => {
    if (disabled) return;

    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };

    clearLongPressTimer();
    longPressTimer.current = window.setTimeout(() => {
      // Trigger haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setDraggedId(itemId);
      isDraggingRef.current = true;
    }, longPressDelay);
  }, [disabled, longPressDelay, clearLongPressTimer]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    // Check if moved too much before long press completes
    if (!isDraggingRef.current && touchStartPos.current) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

      if (deltaX > 10 || deltaY > 10) {
        clearLongPressTimer();
      }
    }

    // Handle drag preview during move
    if (isDraggingRef.current && draggedId) {
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);

      if (element) {
        const draggableElement = element.closest('[data-draggable-id]');
        if (draggableElement) {
          const targetId = draggableElement.getAttribute('data-draggable-id');
          if (targetId && targetId !== draggedId) {
            setDragOverId(targetId);
          }
        }
      }
    }
  }, [disabled, draggedId, clearLongPressTimer]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    clearLongPressTimer();
    touchStartPos.current = null;

    if (isDraggingRef.current && draggedId && dragOverId && draggedId !== dragOverId) {
      const draggedIndex = items.findIndex(item => item.id === draggedId);
      const targetIndex = items.findIndex(item => item.id === dragOverId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const reordered = [...items];
        const [removed] = reordered.splice(draggedIndex, 1);
        reordered.splice(targetIndex, 0, removed);
        onReorder(reordered);
      }
    }

    setDraggedId(null);
    setDragOverId(null);
    isDraggingRef.current = false;
  }, [disabled, draggedId, dragOverId, items, onReorder, clearLongPressTimer]);

  const handleTouchCancel = useCallback(() => {
    clearLongPressTimer();
    setDraggedId(null);
    setDragOverId(null);
    isDraggingRef.current = false;
    touchStartPos.current = null;
  }, [clearLongPressTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearLongPressTimer();
    };
  }, [clearLongPressTimer]);

  return {
    draggedId,
    dragOverId,
    handlers: {
      onDragStart: handleDragStart,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
      onDragEnd: handleDragEnd,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
    },
  };
}
