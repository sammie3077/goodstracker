
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { ProxyService } from '../types';
import { Plus, Edit2, Trash2, ExternalLink, X } from 'lucide-react';

export const ProxyManager: React.FC = () => {
  const [proxies, setProxies] = useState<ProxyService[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [website, setWebsite] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProxies(StorageService.getProxies());
  };

  const handleOpenModal = (proxy?: ProxyService) => {
    if (proxy) {
      setEditingId(proxy.id);
      setName(proxy.name);
      setContactInfo(proxy.contactInfo || '');
      setWebsite(proxy.website || '');
      setNote(proxy.note || '');
    } else {
      setEditingId(null);
      setName('');
      setContactInfo('');
      setWebsite('');
      setNote('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const proxyData: ProxyService = {
      id: editingId || crypto.randomUUID(),
      name,
      contactInfo,
      website,
      note,
    };

    if (editingId) {
      StorageService.updateProxy(proxyData);
    } else {
      StorageService.addProxy(proxyData);
    }

    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    // Removed setTimeout to fix mobile/browser blocking issues
    if (window.confirm('確定要刪除這個代購嗎？相關的周邊資料可能會遺失關聯。')) {
        StorageService.deleteProxy(id);
        if (editingId === id) {
            setIsModalOpen(false);
        }
        loadData();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <span className="text-2xl">🛍️</span> 代購名單
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">管理您常用的代購與賣家資訊</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-secondary text-white px-5 py-2.5 rounded-full hover:bg-secondary-dark transition shadow-lg shadow-secondary/20 font-bold cursor-pointer"
        >
          <Plus size={18} strokeWidth={3} className="pointer-events-none" />
          <span>新增代購</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {proxies.map(proxy => (
          <div 
            key={proxy.id} 
            onClick={() => handleOpenModal(proxy)}
            className="bg-white rounded-3xl p-6 shadow-sm border border-primary-light hover:shadow-xl hover:shadow-primary/20 transition duration-300 hover:-translate-y-1 group cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-gray-800 truncate">{proxy.name}</h3>
              <div className="flex gap-1 opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleOpenModal(proxy); }}
                  className="p-2 text-gray-400 hover:text-primary-dark hover:bg-primary-light rounded-full transition-colors cursor-pointer"
                >
                  <Edit2 size={16} className="pointer-events-none" />
                </button>
                <button 
                  onClick={(e) => handleDelete(proxy.id, e)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                >
                  <Trash2 size={16} className="pointer-events-none" />
                </button>
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              {proxy.contactInfo && (
                <div className="flex items-start gap-3 bg-gray-50 p-2 rounded-xl">
                  <span className="font-bold text-gray-400 text-xs uppercase w-8 mt-0.5">聯絡</span>
                  <p className="font-medium text-gray-700 break-all">{proxy.contactInfo}</p>
                </div>
              )}
              {proxy.website && (
                <div className="flex items-start gap-3 bg-gray-50 p-2 rounded-xl">
                   <span className="font-bold text-gray-400 text-xs uppercase w-8 mt-0.5">網站</span>
                   <a href={proxy.website} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-secondary-dark font-bold hover:underline flex items-center gap-1 truncate max-w-[150px]">
                     連結 <ExternalLink size={12} className="pointer-events-none" />
                   </a>
                </div>
              )}
              {proxy.note && (
                 <p className="mt-3 pt-3 border-t border-dashed border-gray-100 text-xs text-gray-500 italic">
                   "{proxy.note}"
                 </p>
              )}
            </div>
          </div>
        ))}

        {proxies.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-400 border-2 border-dashed border-primary-light rounded-3xl bg-white/50">
            <p className="font-medium">目前沒有代購資料</p>
            <p className="text-sm mt-1">請點擊右上角新增</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border-4 border-white">
            <div className="px-8 py-5 border-b border-gray-100 bg-white flex justify-between items-center">
              <h3 className="font-black text-xl text-gray-800">{editingId ? '✏️ 編輯代購' : '✨ 新增代購'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer">
                <X className="w-5 h-5 pointer-events-none" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">名稱 <span className="text-secondary-dark">*</span></label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-100 shadow-sm focus:border-secondary focus:outline-none p-3 font-medium text-gray-700 bg-white"
                  placeholder="例如：小明的代購屋"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">聯絡資訊</label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={e => setContactInfo(e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-100 shadow-sm focus:border-secondary focus:outline-none p-3 font-medium text-gray-700 bg-white"
                  placeholder="LINE ID / FB 連結 / Email"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">網站/賣場連結</label>
                <input
                  type="url"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-100 shadow-sm focus:border-secondary focus:outline-none p-3 font-medium text-gray-700 bg-white"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">備註</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border-2 border-gray-100 shadow-sm focus:border-secondary focus:outline-none p-3 font-medium text-gray-700 bg-white"
                  placeholder="手續費規則、匯率..."
                />
              </div>
              <div className="pt-2 flex gap-3">
                {editingId && (
                  <button
                    type="button"
                    onClick={(e) => handleDelete(editingId, e)}
                    className="px-4 py-3 border-2 border-red-100 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 hover:border-red-200 font-bold transition flex items-center justify-center cursor-pointer"
                    title="刪除"
                  >
                    <Trash2 size={20} className="pointer-events-none" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-100 text-gray-500 rounded-xl hover:bg-gray-50 font-bold transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-secondary text-white rounded-xl hover:bg-secondary-dark shadow-lg shadow-secondary/20 font-bold transition hover:-translate-y-0.5 cursor-pointer"
                >
                  儲存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
