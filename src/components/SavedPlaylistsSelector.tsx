import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Database, ChevronDown } from 'lucide-react';
import { useSavedAccountsStore } from '../store/useSavedAccountsStore';
import { usePlaylistStore } from '../store/usePlaylistStore';
import { useLanguageStore } from '../store/useLanguageStore';
import type { SavedPlaylist, XtreamCredentials } from '../types/playlist';

export function SavedPlaylistsSelector() {
  const { savedPlaylists, activePlaylistId, setActivePlaylist, removePlaylist } = useSavedAccountsStore();
  const { loadPlaylist, loginXtream, clearPlaylist } = usePlaylistStore();
  const { t } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (playlist: SavedPlaylist) => {
    setActivePlaylist(playlist.id);
    if (playlist.type === 'M3U') {
      loadPlaylist(playlist.data as string);
    } else {
      loginXtream(playlist.data as XtreamCredentials);
    }
    setIsOpen(false);
  };

  const handleRemove = (id: string) => {
    if (activePlaylistId === id) {
      clearPlaylist();
    }
    removePlaylist(id);
    if (savedPlaylists.length <= 1) {
      setIsOpen(false);
    }
  };

  const activePlaylist = savedPlaylists.find(p => p.id === activePlaylistId);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-2.5 py-2 bg-gray-800 border ${isOpen ? 'border-senju-light ring-1 ring-senju-light/20' : 'border-gray-700'} rounded-lg cursor-pointer hover:bg-gray-700 transition-all min-w-[140px] sm:min-w-[180px] text-left`}
      >
        <Database size={16} className={activePlaylist ? "text-senju-light" : "text-gray-500"} />
        <div className="flex-1 text-[11px] sm:text-sm font-medium truncate text-gray-200">
          {activePlaylist ? activePlaylist.name : t.playlists.yourLists}
        </div>
        <ChevronDown size={14} className={`text-gray-500 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
          <div className="p-2 border-b border-gray-800 bg-gray-900/50">
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 px-2 py-1">{t.playlists.savedLists}</p>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1.5 custom-scrollbar">
            {savedPlaylists.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-gray-500 italic">Nenhuma lista salva</p>
              </div>
            ) : (
              savedPlaylists.map((playlist) => (
                <div 
                  key={playlist.id}
                  className={`flex items-center group/item p-2 rounded-lg transition-colors mb-1 last:mb-0 ${
                    activePlaylistId === playlist.id ? 'bg-senju-dark/40 text-senju-light' : 'hover:bg-gray-800 text-gray-400'
                  }`}
                >
                  <button 
                    onClick={() => handleSelect(playlist)}
                    className="flex-1 text-left text-sm font-medium truncate pr-2"
                  >
                    {playlist.name}
                    <span className="block text-[10px] opacity-60 uppercase">{playlist.type}</span>
                  </button>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(playlist.id);
                    }}
                    className="p-2 opacity-100 lg:opacity-0 lg:group-hover/item:opacity-100 hover:bg-red-900/30 hover:text-red-500 text-gray-500 rounded-md transition-all shrink-0"
                    title={t.playlists.remove}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
