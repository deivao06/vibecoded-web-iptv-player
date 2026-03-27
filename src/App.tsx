import React, { useState, useMemo, useEffect } from 'react';
import { usePlaylistStore } from './store/usePlaylistStore';
import { useSavedAccountsStore } from './store/useSavedAccountsStore';
import { useLanguageStore } from './store/useLanguageStore';
import { PlaylistItemCard } from './components/PlaylistItemCard';
import { VideoPlayer } from './components/VideoPlayer';
import { SeriesDetailModal } from './components/SeriesDetailModal';
import { SavedPlaylistsSelector } from './components/SavedPlaylistsSelector';
import { Logo } from './components/Logo';
import { Search, List, Film, Tv, Loader2, Link as LinkIcon, AlertCircle, User, Lock, Globe, Save, ChevronLeft, ChevronRight, RefreshCw, Clock, LayoutGrid, Heart, History, ChevronDown } from 'lucide-react';
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
    <div className="h-screen bg-gray-950 text-gray-100 flex flex-col w-full font-sans selection:bg-senju-light/30 overflow-hidden">
      <header className="bg-gray-900 border-b border-gray-800 p-4 z-30 shadow-xl shrink-0">
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center gap-6">
          <div className="flex items-center gap-4 mr-auto">
            <div className="flex items-center gap-2">
              <div className="bg-senju-dark p-1.5 rounded-xl shadow-lg shadow-senju-dark/20 border border-senju-light/20">
                <Logo size={32} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-black tracking-tighter bg-gradient-to-br from-senju-light to-senju-accent bg-clip-text text-transparent hidden sm:block leading-none uppercase">Senju Player</h1>
                <span className="text-[9px] font-bold text-senju-light/50 uppercase tracking-[0.2em] leading-none mt-1 hidden sm:block">{t.common.slogan}</span>
              </div>
            </div>
            <div className="h-8 w-px bg-gray-800 mx-2 hidden lg:block" />
            <div className="flex items-center gap-2">
              <SavedPlaylistsSelector />
              
              <div className="relative lang-dropdown">
                <button 
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="p-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-gray-400 transition-all flex items-center gap-2"
                >
                  <Globe size={18} />
                  <span className="text-xs font-bold uppercase">{language}</span>
                </button>
                
                {isLangOpen && (
                  <div className="absolute top-full left-0 mt-2 w-32 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 p-1">
                    <button onClick={() => { setLanguage('pt'); setIsLangOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${language === 'pt' ? 'bg-senju-dark text-senju-light' : 'text-gray-400 hover:bg-gray-700'}`}>Português</button>
                    <button onClick={() => { setLanguage('en'); setIsLangOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${language === 'en' ? 'bg-senju-dark text-senju-light' : 'text-gray-400 hover:bg-gray-700'}`}>English</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700">
              <button onClick={() => setLoginMode('M3U')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${loginMode === 'M3U' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}>M3U</button>
              <button onClick={() => setLoginMode('XTREAM')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${loginMode === 'XTREAM' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}>Xtream</button>
            </div>

            <form onSubmit={loginMode === 'M3U' ? handleM3ULoad : handleXtreamLogin} className="flex flex-wrap sm:flex-nowrap w-full sm:w-auto gap-2">
              <input type="text" value={listName} onChange={(e) => setListName(e.target.value)} placeholder={t.common.saveName} className="flex-1 sm:w-32 px-3 py-2 border border-gray-700 rounded-lg bg-gray-800 text-sm focus:ring-2 focus:ring-senju-light outline-none" />
              
              {loginMode === 'M3U' ? (
                <div className="relative flex-1 sm:w-64">
                  <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t.common.m3uUrl} className="w-full pl-9 pr-3 py-2 border border-gray-700 rounded-lg bg-gray-800 text-sm focus:ring-2 focus:ring-senju-light outline-none" required />
                </div>
              ) : (
                <>
                  <div className="relative flex-1 min-w-[140px]"><Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" /><input type="url" value={xtreamUrl} onChange={(e) => setXtreamUrl(e.target.value)} placeholder={t.common.xtreamServer} className="w-full pl-9 pr-3 py-2 border border-gray-700 rounded-lg bg-gray-800 text-sm focus:ring-2 focus:ring-senju-light outline-none" required /></div>
                  <div className="relative w-1/2 sm:w-28"><User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" /><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t.common.username} className="w-full pl-9 pr-3 py-2 border border-gray-700 rounded-lg bg-gray-800 text-sm focus:ring-2 focus:ring-senju-light outline-none" required /></div>
                  <div className="relative w-1/2 sm:w-28"><Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.common.password} className="w-full pl-9 pr-3 py-2 border border-gray-700 rounded-lg bg-gray-800 text-sm focus:ring-2 focus:ring-senju-light outline-none" required /></div>
                </>
              )}
              
              <button type="submit" disabled={isLoading} className="w-full sm:w-auto px-4 py-2 bg-senju-dark hover:bg-senju-light hover:text-senju-dark disabled:bg-gray-700 text-white text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2">
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> {t.common.save}</>}
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex flex-1 w-full max-w-[1600px] mx-auto overflow-hidden">
        <aside className="w-64 bg-gray-900 border-r border-gray-800 p-4 hidden md:flex flex-col gap-6 shrink-0 h-full">
          <div>
            <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">{t.menu.library}</p>
            <div className="flex flex-col gap-1">
              <button onClick={() => setActiveTab('FAVORITE')} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === 'FAVORITE' ? 'bg-gray-800 text-senju-light border border-senju-light/20 shadow-lg shadow-senju-light/5' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}>
                <Heart size={18} fill={activeTab === 'FAVORITE' ? 'currentColor' : 'none'} /> {t.menu.favorites}
              </button>
              <button onClick={() => setActiveTab('RECENT')} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === 'RECENT' ? 'bg-gray-800 text-senju-light border border-senju-light/20 shadow-lg shadow-senju-light/5' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}>
                <History size={18} /> {t.menu.recent}
              </button>
            </div>
          </div>

          <div>
            <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">{t.menu.content}</p>
            <div className="flex flex-col gap-1">
              {[
                { id: 'CHANNEL', icon: Tv, label: t.menu.channels },
                { id: 'MOVIE', icon: Film, label: t.menu.movies },
                { id: 'SERIES', icon: List, label: t.menu.series }
              ].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as ViewCategory)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === tab.id ? 'bg-senju-dark text-senju-light shadow-lg shadow-senju-dark/20 border border-senju-light/10' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}>
                  <tab.icon size={18} /> {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-auto p-4 bg-gray-900/50 rounded-2xl border border-gray-800">
            <p className="text-[10px] text-gray-500 text-center uppercase tracking-tighter">{t.common.version}</p>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 p-4 md:p-6 h-full overflow-hidden">
          {!currentSource && !isLoading && !error ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
              <div className="bg-gray-800 p-8 rounded-full mb-6"><List size={64} className="text-gray-500" /></div>
              <h2 className="text-2xl font-semibold mb-2">{t.common.connectToStart}</h2>
              <p className="max-w-md mx-auto text-gray-400">{t.common.chooseMethod}</p>
            </div>
          ) : error && !currentSource ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="bg-red-900/20 border border-red-900/50 p-6 rounded-xl flex items-center gap-4 text-red-200 max-w-2xl">
                <AlertCircle size={32} className="shrink-0 text-red-500" />
                <div><h3 className="font-bold text-lg">{t.common.errorTitle}</h3><p className="opacity-80">{error}</p></div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between shrink-0">
                <div className="relative flex-1 w-full max-w-2xl">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.common.search} className="block w-full pl-12 pr-4 py-3 border border-gray-700 rounded-2xl bg-gray-900 text-white placeholder-gray-500 focus:ring-2 focus:ring-senju-light outline-none transition-all" />
                </div>
                
                <button onClick={handleRefresh} disabled={isLoading} className="p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-2xl text-gray-400 transition-all shrink-0">
                  <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                </button>
              </div>

              <div className="flex md:hidden gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar shrink-0">
                {[
                  { id: 'FAVORITE', icon: Heart, label: t.menu.favorites },
                  { id: 'RECENT', icon: History, label: t.menu.recent },
                  { id: 'CHANNEL', icon: Tv, label: t.menu.channels },
                  { id: 'MOVIE', icon: Film, label: t.menu.movies },
                  { id: 'SERIES', icon: List, label: t.menu.series }
                ].map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as ViewCategory)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === tab.id ? 'bg-senju-dark text-senju-light border border-senju-light/20 shadow-lg shadow-senju-light/5' : 'bg-gray-900 text-gray-500 border border-gray-800 hover:text-gray-300 hover:border-gray-700'}`}>
                    <tab.icon size={14} /> {tab.label}
                  </button>
                ))}
              </div>

              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-gray-400 bg-gray-900/30 p-3 rounded-xl border border-gray-800/50 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="relative items-per-page-dropdown">
                    <button
                      onClick={() => setIsItemsPerPageOpen(!isItemsPerPageOpen)}
                      className={`flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg border ${isItemsPerPageOpen ? 'border-senju-light ring-2 ring-senju-light/20' : 'border-gray-700'} text-gray-200 transition-all cursor-pointer font-medium hover:bg-gray-700`}
                    >
                      <LayoutGrid size={14} className="text-gray-500" />
                      <span>{itemsPerPage} {t.common.perPage}</span>
                      <ChevronDown size={14} className={`text-senju-light transition-transform duration-300 ${isItemsPerPageOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isItemsPerPageOpen && (
                      <div className="absolute top-full left-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200 origin-top-left p-1">
                        {[6, 12, 24, 48, 96].map(n => (
                          <div
                            key={n}
                            onClick={() => {
                              setItemsPerPage(n);
                              setIsItemsPerPageOpen(false);
                            }}
                            className={`px-3 py-2 rounded-lg cursor-pointer transition-all text-xs font-bold mb-0.5 last:mb-0 ${
                              itemsPerPage === n 
                                ? 'bg-senju-dark text-senju-light' 
                                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                            }`}
                          >
                            {n} {t.common.perPage}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span>{t.common.total}: <strong className="text-gray-200">{filteredItems.length}</strong></span>
                </div>
                {lastUpdated && <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 italic"><Clock size={12} /> {t.common.lastUpdated} {new Date(lastUpdated).toLocaleTimeString()}</div>}
              </div>

              {isCurrentlyLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-12 h-12 text-senju-light animate-spin" />
                  <p className="text-gray-400 font-medium">{t.common.loading}</p>
                </div>
              ) : tabError ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-gray-900/50 rounded-2xl border border-dashed border-gray-800">
                  <AlertCircle size={48} className="text-red-500/50 mb-4" />
                  <h3 className="text-lg font-bold text-gray-200 mb-4">{tabError}</h3>
                  <button onClick={handleRefresh} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl border border-gray-700 font-semibold">{t.common.tryAgain}</button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 pb-6">
                      {paginatedItems.map((item) => (
                        <PlaylistItemCard key={item.id} item={item} onPlay={handleItemClick} />
                      ))}
                    </div>
                    {filteredItems.length === 0 && (
                      <div className="text-center py-32 text-gray-500 italic bg-gray-900/20 rounded-2xl border border-dashed border-gray-800">{t.common.noItems}</div>
                    )}
                  </div>

                  {totalPages > 1 && (
                    <div className="shrink-0 pt-4 pb-2 bg-gradient-to-t from-gray-950 via-gray-950 to-transparent">
                      <div className="flex justify-center">
                        <div className="flex items-center gap-2 p-1 bg-gray-900 border border-gray-800 rounded-xl shadow-xl">
                          <button disabled={currentPage === 1} onClick={() => { setCurrentPage(prev => prev - 1); scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-2 hover:bg-gray-800 rounded-lg disabled:opacity-30"><ChevronLeft size={24} /></button>
                          <div className="flex items-center px-6 font-bold text-gray-200 border-x border-gray-800">{t.common.page} {currentPage} {t.common.of} {totalPages}</div>
                          <button disabled={currentPage === totalPages} onClick={() => { setCurrentPage(prev => prev + 1); scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-2 hover:bg-gray-800 rounded-lg disabled:opacity-30"><ChevronRight size={24} /></button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
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
