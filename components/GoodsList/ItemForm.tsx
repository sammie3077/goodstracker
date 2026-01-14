import React from 'react';
import { GoodsItem, Work, ItemStatus, PaymentStatus, ConditionStatus, SourceType, ProxyService } from '../../types';
import { Edit2, Sparkle, Trash2, Package, MapPin } from 'lucide-react';
import { ImageCropper } from '../ImageCropper';

interface ItemFormProps {
  isOpen: boolean;
  editingItem: GoodsItem | null;
  formData: Partial<GoodsItem>;
  works: Work[];
  proxies: ProxyService[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: (id: string, e?: React.MouseEvent) => void;
  onFormDataChange: (data: Partial<GoodsItem>) => void;
}

export const ItemForm: React.FC<ItemFormProps> = ({
  isOpen,
  editingItem,
  formData,
  works,
  proxies,
  onClose,
  onSubmit,
  onDelete,
  onFormDataChange,
}) => {
  if (!isOpen) return null;

  // Safe Input Handler for Numbers
  const handleNumberInput = (field: keyof GoodsItem, val: string) => {
    onFormDataChange({
      ...formData,
      [field]: val === '' ? ('' as any) : Number(val)
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[2rem] w-full max-w-2xl my-8 overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border-4 border-white">
        <div className="px-8 py-5 border-b border-gray-100 bg-white flex justify-between items-center flex-shrink-0">
          <h3 className="font-black text-xl text-gray-800 flex items-center gap-2">
            {editingItem ? <Edit2 size={24} className="text-primary-dark"/> : <Sparkle size={24} className="text-primary-dark"/>}
            {editingItem ? ' 編輯周邊' : ' 新增周邊'}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer">✕</button>
        </div>

        <form onSubmit={onSubmit} className="p-8 overflow-y-auto custom-scrollbar space-y-8">
          {/* Image Section */}
          <div className="flex justify-center">
            <div className="w-full max-w-xs">
              <ImageCropper
                key={editingItem ? editingItem.id : 'new-item'}
                initialImage={formData.image}
                onImageCropped={(base64) => onFormDataChange({ ...formData, image: base64 })}
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
                onChange={e => onFormDataChange({ ...formData, name: e.target.value })}
                className="w-full border-2 border-gray-100 rounded-xl shadow-sm focus:border-primary focus:outline-none p-3 font-medium bg-white text-gray-900"
                placeholder="例如: 2024年生日徽章"
              />
              {/* NEW: Original Name (Optional) */}
              <div className="mt-4">
                <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">商品原文名稱 <span className="text-xs font-normal text-gray-400">(非必填)</span></label>
                <input
                  type="text"
                  value={formData.originalName || ''}
                  onChange={e => onFormDataChange({ ...formData, originalName: e.target.value })}
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
                    onFormDataChange({
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
                  onChange={e => onFormDataChange({ ...formData, categoryId: e.target.value })}
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
                  onChange={e => onFormDataChange({ ...formData, status: e.target.value as ItemStatus })}
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
                  onChange={e => onFormDataChange({ ...formData, condition: e.target.value as ConditionStatus })}
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
                  onChange={e => onFormDataChange({ ...formData, paymentStatus: e.target.value as PaymentStatus })}
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
                    onChange={() => onFormDataChange({...formData, sourceType: SourceType.PROXY})}
                  />
                  <Package size={18} className="pointer-events-none" /> 找代購
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition font-bold ${formData.sourceType === SourceType.SELF ? 'border-primary bg-primary/10 text-gray-800' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    name="sourceType"
                    className="hidden"
                    checked={formData.sourceType === SourceType.SELF}
                    onChange={() => onFormDataChange({...formData, sourceType: SourceType.SELF})}
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
                      onChange={e => onFormDataChange({ ...formData, proxyId: e.target.value })}
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
                    onChange={e => onFormDataChange({ ...formData, purchaseLocation: e.target.value })}
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
              onClick={(e) => onDelete(editingItem.id, e)}
              className="px-4 py-3 border-2 border-red-100 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 hover:border-red-200 font-bold transition flex items-center justify-center cursor-pointer"
              title="刪除此周邊"
            >
              <Trash2 size={20} className="pointer-events-none" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-200 text-gray-500 rounded-xl hover:bg-white hover:border-gray-300 font-bold transition cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="flex-1 py-3 bg-primary text-gray-900 rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/20 font-bold transition transform active:scale-95 cursor-pointer"
          >
            儲存
          </button>
        </div>
      </div>
    </div>
  );
};
