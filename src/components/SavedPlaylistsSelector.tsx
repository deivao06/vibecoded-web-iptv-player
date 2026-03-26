import { Trash2, Database, ChevronDown } from 'lucide-react';
import { useSavedAccountsStore } from '../store/useSavedAccountsStore';
import { usePlaylistStore } from '../store/usePlaylistStore';
import type { SavedPlaylist, XtreamCredentials } from '../types/playlist';

export function SavedPlaylistsSelector() {
  const { savedPlaylists, activePlaylistId, setActivePlaylist, removePlaylist } = useSavedAccountsStore();
  const { loadPlaylist, loginXtream } = usePlaylistStore();

  const handleSelect = (playlist: SavedPlaylist) => {
    setActivePlaylist(playlist.id);
    if (playlist.type === 'M3U') {
      loadPlaylist(playlist.data as string);
    } else {
      loginXtream(playlist.data as XtreamCredentials);
    }
  };

  if (savedPlaylists.length === 0) return null;

  const activePlaylist = savedPlaylists.find(p => p.id === activePlaylistId);

  return (
    <div className="relative group">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-700 transition-all min-w-[180px]">
        <Database size={16} className="text-blue-400" />
        <div className="flex-1 text-sm font-medium truncate">
          {activePlaylist ? activePlaylist.name : 'Suas Listas'}
        </div>
        <ChevronDown size={14} className="text-gray-500" />
      </div>

      <div className="absolute top-full right-0 mt-2 w-64 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
        <div className="p-2 border-b border-gray-800 bg-gray-900/50">
          <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 px-2 py-1">Listas Salvas</p>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-1">
          {savedPlaylists.map((playlist) => (
            <div 
              key={playlist.id}
              className={`flex items-center group/item p-2 rounded-lg transition-colors mb-1 ${
                activePlaylistId === playlist.id ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-gray-800 text-gray-400'
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
                  removePlaylist(playlist.id);
                }}
                className="p-1.5 opacity-0 group-hover/item:opacity-100 hover:bg-red-900/30 hover:text-red-500 rounded-md transition-all"
                title="Remover lista"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
