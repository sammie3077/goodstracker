
import React, { useState, useEffect, useRef } from 'react';
import { GoodsList } from './components/GoodsList';
import { ProxyManager } from './components/ProxyManager';
import { GalleryList } from './components/GalleryList';
import { StorageService } from './services/storageService';
import { LayoutGrid, Users, Palette, Check, X, Settings, Download, Upload, AlertTriangle, BookOpen, Loader2 } from 'lucide-react';

// --- Theme Definitions ---

type ThemeId = 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'rose';

interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryDark: string;
  background: string;
}

const THEMES: Record<ThemeId, { name: string; colors: ThemeColors }> = {
  yellow: {
    name: '布丁奶黃',
    colors: {
      primary: '#eacaa2',      // Sand / Latte
      primaryLight: '#fdf6ec', // Very light cream
      primaryDark: '#c29a70',  // Darker Sand
      secondary: '#e4b4a1',    // Terracotta
      secondaryDark: '#c08a76',
      background: '#fffefa',   // Warm White
    },
  },
  pink: {
    name: '櫻花欧蕾',
    colors: {
      primary: '#e6c4c4',      // Dusty Pink
      primaryLight: '#fcf6f6', // Very light pink
      primaryDark: '#ba8c8c',  // Deep dusty pink
      secondary: '#ebddd5',    // Beige Pink (User provided)
      secondaryDark: '#bfaea4',
      background: '#fffcfc',   // Rose White
    },
  },
  blue: {
    name: '海鹽蘇打',
    colors: {
      primary: '#859dc0',      // Periwinkle (User provided)
      primaryLight: '#f0f7fa', // Ice Blue
      primaryDark: '#5b7699',  // Deep Blue
      secondary: '#8fb1b4',    // Teal (User provided)
      secondaryDark: '#6a8a8d',
      background: '#fcfdfd',   // Cool White
    },
  },
  green: {
    name: '薄荷抹茶',
    colors: {
      primary: '#c1d7ad',      // Soft Yellow Green
      primaryLight: '#f4f8f2', // Very light green
      primaryDark: '#90c4b7',  // Teal Green
      secondary: '#c2d9d2',    // Sage Grey
      secondaryDark: '#8ba39c',
      background: '#fdfffe',   // Mint White
    },
  },
  purple: {
    name: '紫藤花季',
    colors: {
      primary: '#cab2d1',      // Orchid
      primaryLight: '#f8f4f9', // Very light lilac
      primaryDark: '#afa8cd',  // Medium Purple
      secondary: '#e2d9e6',    // Light Lilac
      secondaryDark: '#988db0',
      background: '#fdfcff',   // Lavender White
    },
  },
  rose: {
    name: '古典玫瑰',
    colors: {
      primary: '#e7c6c5',      // Coral Pink
      primaryLight: '#fcf6f6', // Very light rose
      primaryDark: '#d9a5a4',  // Deep Coral
      secondary: '#ead7dd',    // Dusty Rose
      secondaryDark: '#bda8af',
      background: '#fffefe',   // Lighter Warm White (Almost pure white with tiny pink tint)
    },
  },
};

// Helper to convert Hex to RGB numbers (e.g. "#FF0000" -> "255 0 0") for CSS Variables
const hexToRgbString = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
};

// --- Icons ---

const TreasureChestIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    {/* Shapes */}
    <path d="M12 5L14 9H10L12 5Z" className="fill-secondary/80" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <rect x="14.5" y="6" width="3.5" height="3.5" transform="rotate(15 14.5 6)" className="fill-primary-dark/50" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="7.5" cy="8" r="2" className="fill-primary" stroke="currentColor" strokeWidth="1.5" />
    
    {/* Chest */}
    <path d="M4 11L6 4H18L20 11" className="fill-primary-light" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M4 11H20V18C20 19.6569 18.6569 21 17 21H7C5.34315 21 4 19.6569 4 18V11Z" className="fill-primary/30" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M3 11H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 11V13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <rect x="10.5" y="12.5" width="3" height="2" rx="0.5" className="fill-primary-dark" />
  </svg>
);

// --- App Component ---

type View = 'goods' | 'gallery' | 'proxies';

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentView, setCurrentView] = useState<View>('goods');
  const [currentTheme, setCurrentTheme] = useState<ThemeId>('yellow');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize DB and load theme
  useEffect(() => {
    const initApp = async () => {
        // Init DB (and perform migration if needed)
        await StorageService.init();
        
        // Load Theme
        const savedTheme = localStorage.getItem('app_theme') as ThemeId;
        if (savedTheme && THEMES[savedTheme]) {
            setCurrentTheme(savedTheme);
        }
        
        setIsInitializing(false);
    };
    initApp();
  }, []);

  // Apply theme to CSS variables
  useEffect(() => {
    const theme = THEMES[currentTheme].colors;
    const root = document.documentElement;
    
    root.style.setProperty('--color-primary', hexToRgbString(theme.primary));
    root.style.setProperty('--color-primary-light', hexToRgbString(theme.primaryLight));
    root.style.setProperty('--color-primary-dark', hexToRgbString(theme.primaryDark));
    root.style.setProperty('--color-secondary', hexToRgbString(theme.secondary));
    root.style.setProperty('--color-secondary-dark', hexToRgbString(theme.secondaryDark));
    root.style.setProperty('--color-background', hexToRgbString(theme.background));
    
    localStorage.setItem('app_theme', currentTheme);
  }, [currentTheme]);

  // Export Data Handler
  const handleExport = async () => {
    try {
        const data = await StorageService.getAllData();
        const fileName = `goods-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = href;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
    } catch (e) {
        console.error(e);
        alert('匯出失敗，請重試');
    }
  };

  // Import Data Handler
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm('⚠️ 警告：匯入將會覆寫目前的所有資料。\n\n您確定要繼續嗎？')) {
        // Reset input so validation triggers next time even if same file
        event.target.value = ''; 
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const success = await StorageService.restoreData(json);
        if (success) {
          alert('✅ 資料還原成功！網頁將自動重新整理。');
          window.location.reload();
        } else {
          alert('❌ 資料格式錯誤，無法還原。');
        }
      } catch (error) {
        console.error(error);
        alert('❌ 讀取檔案失敗。');
      }
    };
    reader.readAsText(file);
  };

  if (isInitializing) {
      return (
          <div className="min-h-screen bg-background flex flex-col items-center justify-center text-gray-600 gap-4">
              <Loader2 size={48} className="animate-spin text-primary" />
              <p className="font-bold">正在載入資料庫...</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-background text-gray-800 font-sans flex flex-col pb-20 md:pb-0 transition-colors duration-500">
      {/* Top Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-primary-light z-40 sticky top-0 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 md:h-20 items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 flex items-center justify-center filter drop-shadow-sm text-gray-700">
                  <TreasureChestIcon className="w-full h-full" />
               </div>
              <span className="text-xl md:text-2xl font-black text-gray-700 tracking-tight">
                GoodsTracker
              </span>
            </div>
            
            <div className="flex items-center gap-2">
                {/* Desktop Nav */}
                <div className="hidden md:flex space-x-2 mr-4">
                  <button
                    onClick={() => setCurrentView('goods')}
                    className={`flex items-center px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                      currentView === 'goods' 
                        ? 'bg-primary text-gray-800 shadow-md shadow-primary/20' 
                        : 'text-gray-400 hover:bg-primary-light hover:text-gray-600'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4 mr-2" strokeWidth={2.5} />
                    我的周邊
                  </button>
                  <button
                    onClick={() => setCurrentView('gallery')}
                    className={`flex items-center px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                      currentView === 'gallery' 
                        ? 'bg-primary text-gray-800 shadow-md shadow-primary/20' 
                        : 'text-gray-400 hover:bg-primary-light hover:text-gray-600'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 mr-2" strokeWidth={2.5} />
                    圖鑑
                  </button>
                  <button
                    onClick={() => setCurrentView('proxies')}
                    className={`flex items-center px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                      currentView === 'proxies' 
                        ? 'bg-secondary text-white shadow-md shadow-secondary/20' 
                        : 'text-gray-400 hover:bg-primary-light hover:text-gray-600'
                    }`}
                  >
                    <Users className="w-4 h-4 mr-2" strokeWidth={2.5} />
                    代購名單
                  </button>
                </div>

                {/* Theme Toggle Button */}
                <button 
                  onClick={() => setIsThemeMenuOpen(true)}
                  className="p-2.5 rounded-full bg-white border border-primary-light text-primary-dark shadow-sm hover:shadow-md transition hover:scale-105 active:scale-95"
                  title="切換主題"
                >
                   <Palette size={20} />
                </button>

                {/* Settings Button */}
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2.5 rounded-full bg-white border border-primary-light text-gray-500 shadow-sm hover:shadow-md transition hover:scale-105 active:scale-95 hover:text-gray-800"
                  title="系統設定"
                >
                   <Settings size={20} />
                </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-1 w-full max-w-7xl mx-auto">
        {currentView === 'goods' ? <GoodsList /> : currentView === 'gallery' ? <GalleryList /> : <ProxyManager />}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-primary-light shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 px-6 py-2 pb-safe transition-colors duration-500">
        <div className="flex justify-around items-center">
          <button
            onClick={() => setCurrentView('goods')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl w-full transition-all ${
              currentView === 'goods' 
                ? 'text-gray-800 bg-primary-light' 
                : 'text-gray-400'
            }`}
          >
            <div className={`p-1 rounded-full ${currentView === 'goods' ? 'bg-primary text-gray-800' : ''}`}>
              <LayoutGrid className="w-5 h-5" strokeWidth={currentView === 'goods' ? 3 : 2} />
            </div>
            <span className="text-[10px] font-bold">周邊</span>
          </button>

          <button
            onClick={() => setCurrentView('gallery')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl w-full transition-all ${
              currentView === 'gallery' 
                ? 'text-gray-800 bg-primary-light' 
                : 'text-gray-400'
            }`}
          >
            <div className={`p-1 rounded-full ${currentView === 'gallery' ? 'bg-primary text-gray-800' : ''}`}>
              <BookOpen className="w-5 h-5" strokeWidth={currentView === 'gallery' ? 3 : 2} />
            </div>
            <span className="text-[10px] font-bold">圖鑑</span>
          </button>
          
          <button
            onClick={() => setCurrentView('proxies')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl w-full transition-all ${
              currentView === 'proxies' 
                ? 'text-secondary-dark bg-secondary/10' 
                : 'text-gray-400'
            }`}
          >
            <div className={`p-1 rounded-full ${currentView === 'proxies' ? 'bg-secondary text-white' : ''}`}>
              <Users className="w-5 h-5" strokeWidth={currentView === 'proxies' ? 3 : 2} />
            </div>
            <span className="text-[10px] font-bold">代購</span>
          </button>
        </div>
      </div>

      {/* Theme Selection Modal */}
      {isThemeMenuOpen && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center pointer-events-none">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm pointer-events-auto transition-opacity"
            onClick={() => setIsThemeMenuOpen(false)}
          ></div>

          {/* Modal Content */}
          <div className="bg-white w-full md:w-96 rounded-t-[2rem] md:rounded-[2rem] p-6 pb-safe md:pb-6 shadow-2xl transform transition-transform pointer-events-auto border-4 border-white animate-in slide-in-from-bottom-10 md:animate-in md:zoom-in-95 max-h-[85vh] overflow-y-auto custom-scrollbar">
             <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 py-2">
                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                   <Palette size={20} className="text-primary-dark"/> 選擇主題配色
                </h3>
                <button onClick={() => setIsThemeMenuOpen(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 transition">
                   <X size={20} />
                </button>
             </div>
             
             <div className="grid grid-cols-1 gap-3">
                {(Object.entries(THEMES) as [ThemeId, typeof THEMES[ThemeId]][]).map(([id, theme]) => (
                   <button
                      key={id}
                      onClick={() => { setCurrentTheme(id); setIsThemeMenuOpen(false); }}
                      className={`flex items-center p-3 rounded-2xl border-2 transition-all hover:scale-[1.02] active:scale-95 ${
                         currentTheme === id ? 'border-gray-800 bg-gray-50' : 'border-transparent hover:bg-gray-50'
                      }`}
                   >
                      {/* Color Preview Bubbles */}
                      <div className="flex -space-x-2 mr-4">
                         <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: theme.colors.primary }}></div>
                         <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: theme.colors.secondary }}></div>
                         <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: theme.colors.primaryDark }}></div>
                      </div>
                      
                      <div className="flex-1 text-left">
                         <span className="font-bold text-gray-800">{theme.name}</span>
                      </div>
                      
                      {currentTheme === id && (
                         <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-white">
                            <Check size={14} strokeWidth={3} />
                         </div>
                      )}
                   </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* Settings (Backup/Restore) Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           {/* Backdrop */}
           <div 
             className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity"
             onClick={() => setIsSettingsOpen(false)}
           ></div>

           <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl z-10 border-4 border-white animate-in zoom-in-95">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                      <Settings size={22} className="text-gray-500" />
                      系統設定
                  </h3>
                  <button onClick={() => setIsSettingsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition">
                      <X size={20} />
                  </button>
              </div>
              
              <div className="p-6 space-y-6">
                  {/* Export */}
                  <div className="space-y-2">
                      <h4 className="font-bold text-gray-700 flex items-center gap-2">
                          <Download size={18} className="text-primary-dark"/> 匯出備份 (Export)
                      </h4>
                      <p className="text-xs text-gray-500">
                          下載所有資料的備份檔案 (.json)。您可以將此檔案傳送到新裝置。
                      </p>
                      <button 
                        onClick={handleExport}
                        className="w-full py-3 bg-primary-light text-primary-dark font-bold rounded-xl border-2 border-primary hover:bg-primary hover:text-gray-900 transition-colors shadow-sm"
                      >
                          下載備份檔案
                      </button>
                  </div>

                  <div className="border-t border-dashed border-gray-200"></div>

                  {/* Import */}
                  <div className="space-y-2">
                      <h4 className="font-bold text-gray-700 flex items-center gap-2">
                          <Upload size={18} className="text-secondary-dark"/> 匯入還原 (Import)
                      </h4>
                      <p className="text-xs text-gray-500">
                          上傳備份檔案以還原資料。
                      </p>
                      
                      <div className="bg-red-50 p-3 rounded-xl border border-red-100 flex gap-3 items-start">
                          <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-red-600 font-bold leading-tight">
                              注意：匯入將會覆寫目前的所有資料，且無法復原。
                          </p>
                      </div>

                      <input 
                        type="file" 
                        accept=".json" 
                        ref={fileInputRef} 
                        onChange={handleImport} 
                        className="hidden" 
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl border-2 border-gray-200 hover:bg-secondary hover:border-secondary hover:text-white transition-colors shadow-sm"
                      >
                          選取檔案並還原
                      </button>
                  </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
