
import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Check, ZoomIn, ZoomOut, Image as ImageIcon } from 'lucide-react';

interface ImageCropperProps {
  onImageCropped: (base64: string) => void;
  initialImage?: string;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ onImageCropped, initialImage }) => {
  const [src, setSrc] = useState<string | null>(initialImage || null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(!initialImage);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const rawResult = reader.result as string;
        
        // 1. Load image to generate auto-crop immediately
        const img = new Image();
        img.onload = () => {
            const size = 400; // Standard size
            const aspect = img.width / img.height;
            let drawW, drawH, offX, offY;
            let initialScale = 1;
            
            // Calculate "Cover" dimensions for the canvas generation
            if (aspect > 1) { // Wide
                drawH = size;
                drawW = size * aspect;
                offX = -(drawW - size) / 2;
                offY = 0;
                initialScale = aspect; // Scale for UI to cover square
            } else { // Tall
                drawW = size;
                drawH = size / aspect;
                offX = 0;
                offY = -(drawH - size) / 2;
                initialScale = 1 / aspect; // Scale for UI to cover square
            }
            
            // Generate Auto-Saved Image
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, size, size);
                ctx.drawImage(img, offX, offY, drawW, drawH);
                
                const autoCropped = canvas.toDataURL('image/jpeg', 0.8);
                
                // Save immediately!
                onImageCropped(autoCropped);
            }

            // Update UI State
            setSrc(rawResult);
            setScale(initialScale); // Set UI scale to match the cover look
            setPosition({ x: 0, y: 0 });
            setIsEditing(true);
        };
        img.src = rawResult;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    // Calculate new position
    let newX = clientX - dragStart.x;
    let newY = clientY - dragStart.y;

    // Clamping logic (prevent dragging image out of view)
    // We assume the container is 100% width. The image is scaled relative to the container.
    // This part is tricky without exact container dimensions in px, but we can approximate limits or just allow free drag.
    // For better UX, let's allow free drag but maybe add bounds later.
    // For now, free drag is safer than buggy bounds.
    
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    if (!imageRef.current || !containerRef.current) return;

    const canvas = document.createElement('canvas');
    const size = 400; // Output size
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
        // Calculate the relative position and scale
        const ratio = size / containerRef.current.clientWidth;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        
        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.translate(position.x * ratio, position.y * ratio);
        ctx.scale(scale, scale);
        
        const img = imageRef.current;
        // Draw image centered
        ctx.drawImage(img, -img.width * ratio / 2, -img.height * ratio / 2, img.width * ratio, img.height * ratio);
        
        ctx.restore();
        
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        onImageCropped(base64);
        setIsEditing(false); // Exit edit mode to show preview
        setSrc(base64); // Update the preview source to the cropped version
    }
  };

  const handleCancel = () => {
      // Revert to initial image
      setSrc(initialImage || null);
      onImageCropped(initialImage || ''); // Restore parent state
      setIsEditing(false);
  };

  const handleRemove = () => {
      setSrc(null);
      onImageCropped('');
      setIsEditing(true);
  };

  if (!src) {
      return (
          <div className="w-full aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition relative overflow-hidden group">
              <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              <div className="p-4 rounded-full bg-white shadow-sm mb-2 group-hover:scale-110 transition-transform">
                <Upload className="text-gray-400" size={24} />
              </div>
              <span className="text-sm text-gray-500 font-bold">上傳照片</span>
          </div>
      );
  }

  if (!isEditing) {
      return (
          <div className="relative w-full aspect-square bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-100 group">
              <img src={src} alt="Preview" className="w-full h-full object-cover" />
              <button 
                onClick={() => setIsEditing(true)}
                className="absolute top-2 right-2 bg-white/90 p-2 rounded-full text-gray-700 shadow-md opacity-0 group-hover:opacity-100 transition-all hover:text-primary"
                title="重新裁切"
              >
                  <ZoomIn size={16} />
              </button>
              <button 
                onClick={handleRemove}
                className="absolute top-2 left-2 bg-white/90 p-2 rounded-full text-red-500 shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                title="移除照片"
              >
                  <X size={16} />
              </button>
          </div>
      );
  }

  return (
    <div className="flex flex-col items-center gap-3">
        <div 
            ref={containerRef}
            className="w-full aspect-square bg-gray-900 overflow-hidden relative rounded-xl cursor-move touch-none shadow-inner"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
        >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <img 
                    ref={imageRef}
                    src={src} 
                    alt="Crop source" 
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        maxWidth: 'none',
                        maxHeight: 'none',
                        width: '100%', // Initial fit
                        height: 'auto'
                    }}
                    draggable={false}
                />
            </div>
            {/* Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-30 border-2 border-white/50">
                <div className="w-full h-1/3 border-b border-white/30 absolute top-0"></div>
                <div className="w-full h-1/3 border-b border-white/30 absolute top-1/3"></div>
                <div className="h-full w-1/3 border-r border-white/30 absolute left-0"></div>
                <div className="h-full w-1/3 border-r border-white/30 absolute left-1/3"></div>
            </div>
        </div>

        <div className="w-full flex items-center gap-4 px-2">
            <ZoomOut size={16} className="text-gray-400" />
            <input 
                type="range" 
                min="0.5" 
                max="3" 
                step="0.1" 
                value={scale} 
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <ZoomIn size={16} className="text-gray-400" />
        </div>

        <div className="flex gap-2 w-full mt-1">
            <button 
                type="button"
                onClick={handleCancel}
                className="flex-1 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg"
            >
                取消
            </button>
            <button 
                type="button"
                onClick={handleCrop}
                className="flex-1 py-2 bg-primary text-gray-900 font-bold rounded-lg hover:bg-primary-dark shadow-md"
            >
                更新裁切
            </button>
        </div>
    </div>
  );
};
