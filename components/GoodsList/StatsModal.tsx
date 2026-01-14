import React, { useState } from 'react';
import { TrendingUp, X, CircleDollarSign, Calculator, Package, ChevronRight } from 'lucide-react';

interface CategoryStat {
  name: string;
  total: number;
  count: number;
}

interface WorkStat {
  id: string;
  name: string;
  total: number;
  count: number;
  categories: CategoryStat[];
}

interface Statistics {
  grandTotal: number;
  unpaidTotal: number;
  workStats: WorkStat[];
}

interface StatsModalProps {
  isOpen: boolean;
  statistics: Statistics;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, statistics, onClose }) => {
  const [expandedStatWorkId, setExpandedStatWorkId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
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
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm cursor-pointer">
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
  );
};
