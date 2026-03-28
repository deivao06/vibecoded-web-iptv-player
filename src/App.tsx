import React, { useState, useMemo, useEffect } from 'react';
import { usePlaylistStore } from './store/usePlaylistStore';
import { useSavedAccountsStore } from './store/useSavedAccountsStore';
import { useLanguageStore } from './store/useLanguageStore';
import { PlaylistItemCard } from './components/PlaylistItemCard';
import { VideoPlayer } from './components/VideoPlayer';
import { SeriesDetailModal } from './components/SeriesDetailModal';
import { SavedPlaylistsSelector } from './components/SavedPlaylistsSelector';
import { Logo } from './components/Logo';
import { AdBanner } from './components/AdBanner';
import { Search, List, Film, Tv, Loader2, Link as LinkIcon, AlertCircle, User, Lock, Globe, Save, ChevronLeft, ChevronRight, RefreshCw, Clock, LayoutGrid, Heart, History, ChevronDown, Menu, X, Plus } from 'lucide-react';
import type { PlaylistItem, ItemCategory } from './types/playlist';

type LoginMode = 'M3U' | 'XTREAM';
type ViewCategory = ItemCategory | 'FAVORITE' | 'RECENT';

function App() {
  const { 
    items, isLoading, error, loadPlaylist, loginXtream, fetchCategory, 
    lastUpdated, status, currentSource, currentCredentials,
    favorites, recentlyViewed, recordWatch
  } = usePlaylistStore();
  
  const { addPlaylist } = useSavedAccountsStore();
  const { language, setLanguage, t } = useLanguageStore();
  
  const [loginMode, setLoginMode] = useState<LoginMode>('M3U');
  const [url, setUrl] = useState('');
  const [xtreamUrl, setXtreamUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [listName, setListName] = useState('');

  const [activeTab, setActiveTab] = useState<ViewCategory>('CHANNEL');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingItem, setPlayingItem] = useState<{ url: string; name: string } | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<PlaylistItem | null>(null);

  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  const [isItemsPerPageOpen, setIsItemsPerPageOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginVisible, setIsLoginVisible] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isItemsPerPageOpen && !(event.target as Element).closest('.items-per-page-dropdown')) {
        setIsItemsPerPageOpen(false);
      }
      if (isLangOpen && !(event.target as Element).closest('.lang-dropdown')) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isItemsPerPageOpen, isLangOpen]);

  useEffect(() => {
    const activeId = useSavedAccountsStore.getState().activePlaylistId;
    const playlists = useSavedAccountsStore.getState().savedPlaylists;
    if (activeId && playlists.length > 0) {
      const active = playlists.find(p => p.id === activeId);
      if (active) {
        if (active.type === 'M3U') loadPlaylist(active.data as string);
        else loginXtream(active.data as any);
      }
    }
  }, [loadPlaylist, loginXtream]);

  useEffect(() => {
    if (currentCredentials && ['CHANNEL', 'MOVIE', 'SERIES'].includes(activeTab)) {
      fetchCategory(activeTab as ItemCategory);
    }
  }, [activeTab, currentCredentials, fetchCategory]);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    
    let baseItems: PlaylistItem[] = [];
    
    if (activeTab === 'FAVORITE') {
      baseItems = items.filter(i => favorites.includes(i.id));
    } else if (activeTab === 'RECENT') {
      baseItems = recentlyViewed
        .map(id => items.find(i => i.id === id))
        .filter((i): i is PlaylistItem => !!i);
    } else {
      baseItems = items.filter(item => item.category === activeTab);
    }
    
    if (!searchQuery.trim()) return baseItems;
    
    const query = searchQuery.toLowerCase();
    return baseItems.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.groupName?.toLowerCase().includes(query)
    );
  }, [items, activeTab, searchQuery, favorites, recentlyViewed]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, itemsPerPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  const handleM3ULoad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      const success = await loadPlaylist(url, true);
      if (success && listName) {
        addPlaylist({ name: listName, type: 'M3U', data: url });
        setListName('');
      }
    }
  };

  const handleXtreamLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (xtreamUrl && username && password) {
      const success = await loginXtream({ url: xtreamUrl, username, password }, true);
      if (success && listName) {
        addPlaylist({ name: listName, type: 'XTREAM', data: { url: xtreamUrl, username, password } });
        setListName('');
      }
    }
  };

  const handleRefresh = () => {
    const activeId = useSavedAccountsStore.getState().activePlaylistId;
    const playlists = useSavedAccountsStore.getState().savedPlaylists;
    const active = playlists.find(p => p.id === activeId);
    if (active) {
      if (active.type === 'M3U') loadPlaylist(active.data as string, true);
      else loginXtream(active.data as any, true);
    }
  };

  const handleItemClick = (item: PlaylistItem) => {
    recordWatch(item.id);
    if (item.category === 'SERIES' && currentCredentials) {
      setSelectedSeries(item);
    } else {
      setPlayingItem({ url: item.url, name: item.name });
    }
  };

  const isCurrentlyLoading = isLoading || (['CHANNEL', 'MOVIE', 'SERIES'].includes(activeTab) && status[activeTab as ItemCategory]?.isLoading);
  const tabError = ['CHANNEL', 'MOVIE', 'SERIES'].includes(activeTab) ? status[activeTab as ItemCategory]?.error : null;

  return (
    <div className="fixed inset-0 bg-gray-950 text-gray-100 flex flex-col w-full font-sans selection:bg-senju-light/30 overflow-hidden">
      <header className="bg-gray-900 border-b border-gray-800 p-3 lg:p-4 z-40 shadow-xl shrink-0 overflow-y-auto max-h-[80vh]">
        <div className="max-w-[1900px] mx-auto flex flex-col lg:flex-row items-center gap-3 lg:gap-4">
          {/* Logo Section - Full width on mobile */}
          <div className="flex items-center justify-center lg:justify-start w-full lg:w-auto">
            <div className="flex items-center gap-2">
              <div className="bg-senju-dark p-1.5 rounded-xl shadow-lg shadow-senju-dark/20 border border-senju-light/20">
                <Logo size={24} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base lg:text-xl font-black tracking-tighter bg-gradient-to-br from-senju-light to-senju-accent bg-clip-text text-transparent leading-none uppercase">Senju Player</h1>
                <span className="text-[7px] lg:text-[9px] font-bold text-senju-light/50 uppercase tracking-[0.2em] leading-none mt-1 hidden sm:block">{t.common.slogan}</span>
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex items-center justify-between lg:justify-end w-full lg:flex-1 gap-2">
            <div className="flex items-center gap-2">
              {currentSource && (
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden p-2 bg-gray-800 border border-gray-700 hover:bg-gray-700 rounded-xl text-gray-400"
                >
                  {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              )}
              <SavedPlaylistsSelector />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative lang-dropdown hidden sm:block">
                <button 
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="p-2 lg:p-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-gray-400 transition-all flex items-center gap-2"
                >
                  <Globe size={16} />
                  <span className="text-xs font-bold uppercase">{language}</span>
                </button>
                
                {isLangOpen && (
                  <div className="absolute top-full right-0 mt-2 w-32 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 p-1">
                    <button onClick={() => { setLanguage('pt'); setIsLangOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${language === 'pt' ? 'bg-senju-dark text-senju-light' : 'text-gray-400 hover:bg-gray-700'}`}>Português</button>
                    <button onClick={() => { setLanguage('en'); setIsLangOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${language === 'en' ? 'bg-senju-dark text-senju-light' : 'text-gray-400 hover:bg-gray-700'}`}>English</button>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setIsLoginVisible(!isLoginVisible)}
                className={`p-2 lg:px-4 lg:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${isLoginVisible ? 'bg-senju-light text-senju-dark shadow-lg shadow-senju-light/20' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'}`}
              >
                <Plus size={18} />
                <span className="hidden lg:inline">{t.common.save}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Login Form Panel (Mobile/Desktop Toggle) */}
        {isLoginVisible && (
          <div className="mt-3 p-4 bg-gray-800/80 backdrop-blur-md rounded-2xl border border-gray-700 animate-in slide-in-from-top duration-300">
            <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center gap-4">
              <div className="flex bg-gray-950 p-1 rounded-lg border border-gray-800 w-full lg:w-auto">
                <button onClick={() => setLoginMode('M3U')} className={`flex-1 lg:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${loginMode === 'M3U' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>M3U</button>
                <button onClick={() => setLoginMode('XTREAM')} className={`flex-1 lg:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${loginMode === 'XTREAM' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Xtream</button>
              </div>

              <form onSubmit={loginMode === 'M3U' ? handleM3ULoad : handleXtreamLogin} className="flex flex-col lg:flex-row w-full gap-2">
                <input type="text" value={listName} onChange={(e) => setListName(e.target.value)} placeholder={t.common.saveName} className="w-full lg:w-48 px-3 py-2.5 border border-gray-700 rounded-xl bg-gray-900 text-sm focus:ring-2 focus:ring-senju-light outline-none" />
                
                {loginMode === 'M3U' ? (
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t.common.m3uUrl} className="w-full pl-9 pr-3 py-2.5 border border-gray-700 rounded-xl bg-gray-900 text-sm focus:ring-2 focus:ring-senju-light outline-none" required />
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row gap-2 flex-1">
                    <div className="relative flex-1"><Globe className="absolute left-3 top-3 h-4 w-4 text-gray-500" /><input type="url" value={xtreamUrl} onChange={(e) => setXtreamUrl(e.target.value)} placeholder={t.common.xtreamServer} className="w-full pl-9 pr-3 py-2.5 border border-gray-700 rounded-xl bg-gray-900 text-sm focus:ring-2 focus:ring-senju-light outline-none" required /></div>
                    <div className="relative lg:w-32"><User className="absolute left-3 top-3 h-4 w-4 text-gray-500" /><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t.common.username} className="w-full pl-9 pr-3 py-2.5 border border-gray-700 rounded-xl bg-gray-900 text-sm focus:ring-2 focus:ring-senju-light outline-none" required /></div>
                    <div className="relative lg:w-32"><Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.common.password} className="w-full pl-9 pr-3 py-2.5 border border-gray-700 rounded-xl bg-gray-900 text-sm focus:ring-2 focus:ring-senju-light outline-none" required /></div>
                  </div>
                )}
                
                <button type="submit" disabled={isLoading} className="w-full lg:w-auto px-6 py-2.5 bg-senju-dark hover:bg-senju-light hover:text-senju-dark disabled:bg-gray-800 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                  {isLoading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> {t.common.save}</>}
                </button>
              </form>
            </div>
          </div>
        )}
      </header>

      <div className="flex flex-1 w-full max-w-[1900px] mx-auto overflow-hidden relative">
        {/* Banner Esquerdo (Vertical) */}
        {currentSource && (
          <aside className="hidden 2xl:flex w-40 shrink-0 h-full p-2 items-start pt-4">
            <AdBanner slot="LEFT_AD_SLOT" className="w-full h-[600px] sticky top-4" />
          </aside>
        )}

        {/* Sidebar: Desktop Sidebar & Mobile Drawer */}
        {currentSource && (
          <>
            {/* Mobile Overlay */}
            {isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}
            
            <aside className={`
              fixed lg:static inset-y-0 left-0 z-50 w-[280px] lg:w-64 bg-gray-900 border-r border-gray-800 p-4 flex flex-col gap-6 shrink-0 h-full transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
              <div className="flex lg:hidden items-center gap-3 px-2 mb-2">
                <div className="bg-senju-dark p-1 rounded-lg">
                  <Logo size={20} />
                </div>
                <h2 className="text-sm font-black uppercase tracking-tighter text-senju-light">Senju Menu</h2>
                <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden ml-auto p-1.5 hover:bg-gray-800 rounded-lg text-gray-500">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 opacity-50">{t.menu.library}</p>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => { setActiveTab('FAVORITE'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === 'FAVORITE' ? 'bg-senju-dark/20 text-senju-light border border-senju-light/10 shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}>
                      <Heart size={18} fill={activeTab === 'FAVORITE' ? 'currentColor' : 'none'} /> {t.menu.favorites}
                    </button>
                    <button onClick={() => { setActiveTab('RECENT'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === 'RECENT' ? 'bg-senju-dark/20 text-senju-light border border-senju-light/10 shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}>
                      <History size={18} /> {t.menu.recent}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 opacity-50">{t.menu.content}</p>
                  <div className="flex flex-col gap-1">
                    {[
                      { id: 'CHANNEL', icon: Tv, label: t.menu.channels },
                      { id: 'MOVIE', icon: Film, label: t.menu.movies },
                      { id: 'SERIES', icon: List, label: t.menu.series }
                    ].map((tab) => (
                      <button 
                        key={tab.id} 
                        onClick={() => { setActiveTab(tab.id as ViewCategory); setIsSidebarOpen(false); }} 
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === tab.id ? 'bg-senju-dark text-senju-light shadow-lg shadow-senju-dark/20 border border-senju-light/10' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                      >
                        <tab.icon size={18} /> {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-auto p-4 bg-gray-950/50 rounded-2xl border border-gray-800">
                <p className="text-[10px] text-gray-600 text-center uppercase tracking-widest font-bold">{t.common.version}</p>
              </div>
            </aside>
          </>
        )}

        <main className="flex-1 flex flex-col min-w-0 p-3 md:p-6 h-full overflow-hidden relative">
          {!currentSource && !isLoading && !error ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <div className="bg-gray-900 p-8 rounded-full mb-6 border border-gray-800 shadow-2xl animate-in zoom-in duration-500">
                <Plus size={64} className="text-senju-light/30" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-black mb-3 text-white uppercase tracking-tighter">{t.common.connectToStart}</h2>
              <p className="max-w-sm mx-auto text-gray-500 text-sm mb-8 leading-relaxed font-medium">{t.common.chooseMethod}</p>
              <button 
                onClick={() => setIsLoginVisible(true)}
                className="px-10 py-4 bg-senju-dark hover:bg-senju-light hover:text-senju-dark text-white font-black rounded-2xl shadow-2xl shadow-senju-dark/30 transition-all transform hover:scale-105 active:scale-95 uppercase text-xs tracking-widest"
              >
                {t.common.save}
              </button>
            </div>
          ) : error && !currentSource ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="bg-red-950/20 border border-red-900/30 p-8 rounded-3xl flex flex-col items-center text-center gap-4 text-red-200 max-w-md shadow-2xl">
                <div className="bg-red-900/40 p-4 rounded-full"><AlertCircle size={32} className="text-red-500" /></div>
                <div><h3 className="font-bold text-xl mb-2">{t.common.errorTitle}</h3><p className="text-sm opacity-70 leading-relaxed">{error}</p></div>
                <button onClick={() => setIsLoginVisible(true)} className="mt-4 px-8 py-3 bg-red-900/30 hover:bg-red-900/50 rounded-xl text-xs font-black uppercase tracking-widest transition-all">{t.common.tryAgain}</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row gap-4 mb-4 lg:mb-8 items-center justify-between shrink-0">
                <div className="relative flex-1 w-full max-w-2xl">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.common.search} className="block w-full pl-12 pr-4 py-3.5 border border-gray-800 rounded-2xl bg-gray-900 text-white placeholder-gray-600 focus:ring-2 focus:ring-senju-light outline-none transition-all text-sm shadow-inner" />
                </div>
                
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button onClick={handleRefresh} disabled={isLoading} className="flex-1 md:flex-none p-3.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-2xl text-gray-500 transition-all flex items-center justify-center gap-2">
                    <RefreshCw size={18} className={isLoading ? 'animate-spin text-senju-light' : ''} />
                    <span className="md:hidden text-[10px] font-black uppercase tracking-widest">Sincronizar</span>
                  </button>
                </div>
              </div>

              <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[10px] lg:text-xs text-gray-500 bg-gray-900/20 p-3 rounded-xl border border-gray-800/30 shrink-0">
                <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
                  <div className="relative items-per-page-dropdown">
                    <button
                      onClick={() => setIsItemsPerPageOpen(!isItemsPerPageOpen)}
                      className={`flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-lg border ${isItemsPerPageOpen ? 'border-senju-light ring-2 ring-senju-light/20' : 'border-gray-800'} text-gray-300 transition-all cursor-pointer font-bold hover:bg-gray-800`}
                    >
                      <LayoutGrid size={14} className="text-gray-600" />
                      <span>{itemsPerPage}</span>
                      <ChevronDown size={14} className={`text-senju-light transition-transform duration-300 ${isItemsPerPageOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isItemsPerPageOpen && (
                      <div className="absolute top-full left-0 mt-2 w-40 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200 origin-top-left p-1">
                        {[6, 12, 24, 48, 96].map(n => (
                          <div key={n} onClick={() => { setItemsPerPage(n); setIsItemsPerPageOpen(false); }} className={`px-3 py-2 rounded-lg cursor-pointer transition-all text-[10px] font-black uppercase tracking-widest mb-0.5 last:mb-0 ${itemsPerPage === n ? 'bg-senju-dark text-senju-light' : 'text-gray-500 hover:bg-gray-800 hover:text-white'}`}>{n} {t.common.perPage}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="font-medium tracking-tight">{t.common.total}: <strong className="text-senju-light">{filteredItems.length}</strong></span>
                </div>
                {lastUpdated && <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-gray-600 italic font-medium"><Clock size={12} /> {t.common.lastUpdated} {new Date(lastUpdated).toLocaleTimeString()}</div>}
              </div>

              {isCurrentlyLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-senju-dark rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-senju-light rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                  </div>
                  <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">{t.common.loading}</p>
                </div>
              ) : tabError ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-gray-900/20 rounded-3xl border border-dashed border-gray-800 p-8 text-center animate-in fade-in duration-500">
                  <div className="bg-red-950/20 p-4 rounded-full mb-4"><AlertCircle size={40} className="text-red-500/50" /></div>
                  <h3 className="text-base font-bold text-gray-300 mb-6 max-w-xs mx-auto">{tabError}</h3>
                  <button onClick={handleRefresh} className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl border border-gray-700 font-black uppercase text-[10px] tracking-widest transition-all">{t.common.tryAgain}</button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6 pb-6">
                      {paginatedItems.map((item) => (
                        <PlaylistItemCard key={item.id} item={item} onPlay={handleItemClick} />
                      ))}
                    </div>
                    {filteredItems.length === 0 && (
                      <div className="text-center py-32 bg-gray-900/10 rounded-3xl border border-dashed border-gray-800/50">
                        <List size={48} className="mx-auto text-gray-800 mb-4" />
                        <p className="text-gray-600 font-bold uppercase tracking-widest text-[10px]">{t.common.noItems}</p>
                      </div>
                    )}
                  </div>

                  {totalPages > 1 && (
                    <div className="shrink-0 pt-4 pb-2 bg-gradient-to-t from-gray-950 via-gray-950 to-transparent">
                      <div className="flex justify-center">
                        <div className="flex items-center gap-1 p-1 bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-2xl shadow-2xl scale-90 sm:scale-100">
                          <button disabled={currentPage === 1} onClick={() => { setCurrentPage(prev => prev - 1); scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-2.5 hover:bg-gray-800 rounded-xl disabled:opacity-20 transition-all"><ChevronLeft size={20} /></button>
                          <div className="flex items-center px-4 sm:px-8 font-black text-gray-200 border-x border-gray-800 text-[10px] sm:text-xs uppercase tracking-widest">{t.common.page} {currentPage} <span className="mx-1 text-gray-600">/</span> {totalPages}</div>
                          <button disabled={currentPage === totalPages} onClick={() => { setCurrentPage(prev => prev + 1); scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-2.5 hover:bg-gray-800 rounded-xl disabled:opacity-20 transition-all"><ChevronRight size={20} /></button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>

        {/* Banner Direito (Vertical) */}
        {currentSource && (
          <aside className="hidden xl:flex w-40 shrink-0 h-full p-2 items-start pt-4">
            <AdBanner slot="RIGHT_AD_SLOT" className="w-full h-[600px] sticky top-4" />
          </aside>
        )}
      </div>

      {selectedSeries && currentCredentials && (
        <SeriesDetailModal 
          series={selectedSeries} 
          credentials={currentCredentials} 
          onClose={() => setSelectedSeries(null)}
          onPlayEpisode={(ep) => setPlayingItem({ url: ep.url, name: ep.title })}
        />
      )}

      {playingItem && <VideoPlayer url={playingItem.url} title={playingItem.name} onClose={() => setPlayingItem(null)} />}
      <footer className="shrink-0 border-t border-gray-800 p-4 text-center text-gray-500 text-[10px] uppercase tracking-widest bg-gray-950">{t.common.footer}</footer>
    </div>
  );
}

export default App;
