import React, { useMemo } from 'react';
import { GoodsItem } from '../../types';
import { X, Calendar, TrendingUp } from 'lucide-react';

interface MonthlyStatsModalProps {
  isOpen: boolean;
  items: GoodsItem[];
  onClose: () => void;
}

interface MonthlyData {
  yearMonth: string;
  total: number;
  count: number;
  items: GoodsItem[];
}

export const MonthlyStatsModal: React.FC<MonthlyStatsModalProps> = ({
  isOpen,
  items,
  onClose,
}) => {
  // Calculate monthly statistics
  const monthlyStats = useMemo(() => {
    // Filter items that have purchase date
    const itemsWithDate = items.filter(item => item.purchaseDate);

    // Group by year-month
    const grouped = new Map<string, MonthlyData>();

    itemsWithDate.forEach(item => {
      const date = new Date(item.purchaseDate!);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!grouped.has(yearMonth)) {
        grouped.set(yearMonth, {
          yearMonth,
          total: 0,
          count: 0,
          items: []
        });
      }

      const data = grouped.get(yearMonth)!;
      data.total += item.price * item.quantity;
      data.count += 1;
      data.items.push(item);
    });

    // Convert to array and sort by year-month descending (newest first)
    return Array.from(grouped.values()).sort((a, b) =>
      b.yearMonth.localeCompare(a.yearMonth)
    );
  }, [items]);

  // Format year-month for display
  const formatYearMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    return `${year} 年 ${parseInt(month)} 月`;
  };

  // Calculate total across all months
  const grandTotal = useMemo(() => {
    return monthlyStats.reduce((sum, month) => sum + month.total, 0);
  }, [monthlyStats]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl border-4 border-white flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
          <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <Calendar size={24} className="text-primary-dark" />
            月度支出統計
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {monthlyStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Calendar size={64} className="mb-4 opacity-30" />
              <p className="text-lg font-bold">尚無登記日期的周邊</p>
              <p className="text-sm mt-2">請在新增周邊時勾選「登記購買日期」</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Grand Total Card */}
              <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-6 text-gray-900 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold opacity-80">總計支出</p>
                    <p className="text-3xl font-black mt-1">
                      ${grandTotal.toLocaleString()}
                    </p>
                    <p className="text-xs opacity-70 mt-1">
                      共 {monthlyStats.reduce((sum, m) => sum + m.count, 0)} 筆記錄
                    </p>
                  </div>
                  <TrendingUp size={48} className="opacity-20" />
                </div>
              </div>

              {/* Monthly Breakdown */}
              <div className="space-y-3">
                {monthlyStats.map((month) => (
                  <div
                    key={month.yearMonth}
                    className="bg-white border-2 border-gray-100 rounded-2xl p-5 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <h4 className="font-black text-gray-800 text-lg">
                          {formatYearMonth(month.yearMonth)}
                        </h4>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-primary">
                          ${month.total.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400 font-bold">
                          {month.count} 件周邊
                        </p>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
                      {month.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-sm py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-700 truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(item.purchaseDate!).toLocaleDateString('zh-TW')}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-bold text-gray-800">
                              ${(item.price * item.quantity).toLocaleString()}
                            </p>
                            {item.quantity > 1 && (
                              <p className="text-xs text-gray-400">
                                ${item.price} × {item.quantity}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-primary text-gray-900 rounded-xl hover:bg-primary-dark font-bold transition shadow-md shadow-primary/20"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
