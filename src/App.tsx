import React, { useState, useMemo, useEffect } from 'react';
import { usePlaylistStore } from './store/usePlaylistStore';
import { useSavedAccountsStore } from './store/useSavedAccountsStore';
import { PlaylistItemCard } from './components/PlaylistItemCard';
import { VideoPlayer } from './components/VideoPlayer';
import { SeriesDetailModal } from './components/SeriesDetailModal';
import { SavedPlaylistsSelector } from './components/SavedPlaylistsSelector';
import { Search, List, Film, Tv, Play, Loader2, Link as LinkIcon, AlertCircle, User, Lock, Globe, Save, ChevronLeft, ChevronRight, RefreshCw, Clock, LayoutGrid } from 'lucide-react';
import type { PlaylistItem, ItemCategory } from './types/playlist';

type LoginMode = 'M3U' | 'XTREAM';

function App() {
  // Pegamos o necessário da store
  const { items, isLoading, error, loadPlaylist, loginXtream, fetchCategory, lastUpdated, status, currentSource, currentCredentials } = usePlaylistStore();
  const { addPlaylist } = useSavedAccountsStore();
  
  // Estados de UI
  const [loginMode, setLoginMode] = useState<LoginMode>('M3U');
  const [url, setUrl] = useState('');
  const [xtreamUrl, setXtreamUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [listName, setListName] = useState('');

  const [activeTab, setActiveTab] = useState<ItemCategory>('CHANNEL');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingItem, setPlayingItem] = useState<{ url: string; name: string } | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<PlaylistItem | null>(null);

  // Paginação
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [currentPage, setCurrentPage] = useState(1);

  // Auto-load - Carrega a lista salva ao iniciar
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

  // Dispara carregamento da categoria se necessário ao mudar de aba (para Xtream)
  useEffect(() => {
    if (currentCredentials) {
      fetchCategory(activeTab);
    }
  }, [activeTab, currentCredentials, fetchCategory]);

  // FILTRAGEM
  const filteredItems = useMemo(() => {
    if (!items) return [];
    
    // 1. Filtra por categoria
    const categoryItems = items.filter(item => item.category === activeTab);
    
    // 2. Filtra por busca se houver query
    if (!searchQuery.trim()) return categoryItems;
    
    const query = searchQuery.toLowerCase();
    return categoryItems.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.groupName?.toLowerCase().includes(query)
    );
  }, [items, activeTab, searchQuery]);

  // Resetar página ao mudar filtros
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
    if (item.category === 'SERIES' && currentCredentials) {
      setSelectedSeries(item);
    } else {
      setPlayingItem({ url: item.url, name: item.name });
    }
  };

  // Status de carregamento combinado (Geral ou por Aba)
  const isCurrentlyLoading = isLoading || status[activeTab]?.isLoading;
  const tabError = status[activeTab]?.error;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col w-full font-sans selection:bg-blue-500/30">
      <header className="bg-gray-900 border-b border-gray-800 p-4 sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-6">
          <div className="flex items-center gap-4 mr-auto">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
                <Play className="text-white fill-current" size={24} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent hidden sm:block">IPTV Player</h1>
            </div>
            <div className="h-8 w-px bg-gray-800 mx-2 hidden lg:block" />
            <SavedPlaylistsSelector />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700">
              <button onClick={() => setLoginMode('M3U')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${loginMode === 'M3U' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}>M3U</button>
              <button onClick={() => setLoginMode('XTREAM')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${loginMode === 'XTREAM' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}>Xtream</button>
            </div>

            <form onSubmit={loginMode === 'M3U' ? handleM3ULoad : handleXtreamLogin} className="flex flex-wrap sm:flex-nowrap w-full sm:w-auto gap-2">
              <input type="text" value={listName} onChange={(e) => setListName(e.target.value)} placeholder="Nome p/ Salvar" className="flex-1 sm:w-32 px-3 py-2 border border-gray-700 rounded-lg bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              
              {loginMode === 'M3U' ? (
                <div className="relative flex-1 sm:w-64">
                  <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL da lista" className="w-full pl-9 pr-3 py-2 border border-gray-700 rounded-lg bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
              ) : (
                <>
                  <div className="relative flex-1 min-w-[140px]"><Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" /><input type="url" value={xtreamUrl} onChange={(e) => setXtreamUrl(e.target.value)} placeholder="http://servidor.com" className="w-full pl-9 pr-3 py-2 border border-gray-700 rounded-lg bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
                  <div className="relative w-1/2 sm:w-28"><User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" /><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Usuário" className="w-full pl-9 pr-3 py-2 border border-gray-700 rounded-lg bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
                  <div className="relative w-1/2 sm:w-28"><Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" className="w-full pl-9 pr-3 py-2 border border-gray-700 rounded-lg bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
                </>
              )}
              
              <button type="submit" disabled={isLoading} className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Entrar</>}
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6">
        {!currentSource && !isLoading && !error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
            <div className="bg-gray-800 p-8 rounded-full mb-6"><List size={64} className="text-gray-500" /></div>
            <h2 className="text-2xl font-semibold mb-2">Conecte-se para começar</h2>
            <p className="max-w-md mx-auto text-gray-400">Escolha o método acima e insira suas credenciais.</p>
          </div>
        ) : error && !currentSource ? (
          <div className="bg-red-900/20 border border-red-900/50 p-6 rounded-xl flex items-center gap-4 text-red-200 my-10 max-w-2xl mx-auto">
            <AlertCircle size={32} className="shrink-0 text-red-500" />
            <div><h3 className="font-bold text-lg">Erro de Conexão</h3><p className="opacity-80">{error}</p></div>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
              <div className="flex p-1 bg-gray-900 rounded-xl border border-gray-800 w-full md:w-auto overflow-x-auto">
                {[
                  { id: 'CHANNEL', icon: Tv, label: 'Canais' },
                  { id: 'MOVIE', icon: Film, label: 'Filmes' },
                  { id: 'SERIES', icon: List, label: 'Séries' }
                ].map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as ItemCategory)} className={`flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}>
                    <tab.icon size={18} /><span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar nesta categoria..." className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <button onClick={handleRefresh} disabled={isLoading || Object.values(status).some(s => s.isLoading)} title="Sincronizar Tudo" className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-all disabled:opacity-50">
                  <RefreshCw size={20} className={(isLoading || Object.values(status).some(s => s.isLoading)) ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-gray-400 bg-gray-900/30 p-3 rounded-xl border border-gray-800/50">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
                  <LayoutGrid size={14} className="text-gray-500" />
                  <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="bg-transparent text-gray-200 outline-none cursor-pointer font-medium">
                    {[6, 12, 18, 24, 30].map(n => <option key={n} value={n} className="bg-gray-900">{n} por página</option>)}
                  </select>
                </div>
                <span>Total: <strong className="text-gray-200">{filteredItems.length}</strong></span>
              </div>

              <div className="flex items-center gap-4">
                {lastUpdated && <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 italic"><Clock size={12} /> Sincronizado: {new Date(lastUpdated).toLocaleTimeString()}</div>}
                {totalPages > 1 && !isCurrentlyLoading && !tabError && (
                  <div className="flex items-center gap-2">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg disabled:opacity-30"><ChevronLeft size={18} /></button>
                    <span className="font-semibold text-gray-300 min-w-[80px] text-center">{currentPage} / {totalPages}</span>
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg disabled:opacity-30"><ChevronRight size={18} /></button>
                  </div>
                )}
              </div>
            </div>

            {isCurrentlyLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                <p className="text-gray-400 font-medium">Carregando conteúdo...</p>
              </div>
            ) : tabError ? (
              <div className="flex flex-col items-center justify-center py-24 bg-gray-900/50 rounded-2xl border border-dashed border-gray-800">
                <AlertCircle size={48} className="text-red-500/50 mb-4" />
                <h3 className="text-lg font-bold text-gray-200 mb-4">{tabError}</h3>
                <button onClick={handleRefresh} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl border border-gray-700 font-semibold">Tentar Novamente</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {paginatedItems.map((item) => (
                  <PlaylistItemCard key={item.id} item={item} onPlay={handleItemClick} />
                ))}
              </div>
            )}

            {totalPages > 1 && !isCurrentlyLoading && !tabError && (
              <div className="flex justify-center mt-12 mb-12">
                <div className="flex items-center gap-2 p-1 bg-gray-900 border border-gray-800 rounded-xl shadow-xl">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 hover:bg-gray-800 rounded-lg disabled:opacity-30"><ChevronLeft size={24} /></button>
                  <div className="flex items-center px-6 font-bold text-gray-200 border-x border-gray-800">Página {currentPage} de {totalPages}</div>
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 hover:bg-gray-800 rounded-lg disabled:opacity-30"><ChevronRight size={24} /></button>
                </div>
              </div>
            )}

            {!isCurrentlyLoading && !tabError && filteredItems.length === 0 && (
              <div className="text-center py-32 text-gray-500 italic bg-gray-900/20 rounded-2xl border border-dashed border-gray-800">Nenhum item encontrado nesta categoria.</div>
            )}
          </>
        )}
      </main>

      {selectedSeries && currentCredentials && (
        <SeriesDetailModal 
          series={selectedSeries} 
          credentials={currentCredentials} 
          onClose={() => setSelectedSeries(null)}
          onPlayEpisode={(ep) => setPlayingItem({ url: ep.url, name: ep.title })}
        />
      )}

      {playingItem && <VideoPlayer url={playingItem.url} title={playingItem.name} onClose={() => setPlayingItem(null)} />}
      <footer className="mt-auto border-t border-gray-800 p-8 text-center text-gray-500 text-sm">IPTV Web Player — M3U & Xtream Codes API</footer>
    </div>
  );
}

export default App;
