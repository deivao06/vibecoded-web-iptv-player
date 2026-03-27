import React from 'react';
import { Play, Film, Tv, Heart } from 'lucide-react';
import type { PlaylistItem } from '../types/playlist';
import { usePlaylistStore } from '../store/usePlaylistStore';

interface PlaylistItemCardProps {
  item: PlaylistItem;
  onPlay: (item: PlaylistItem) => void;
}

export const PlaylistItemCard: React.FC<PlaylistItemCardProps> = ({ item, onPlay }) => {
  const { toggleFavorite, favorites } = usePlaylistStore();
  const isFavorite = favorites.includes(item.id);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(item.id);
  };

  return (
    <div 
      className="group relative bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-blue-500 transition-all cursor-pointer shadow-lg hover:shadow-blue-500/10"
      onClick={() => onPlay(item)}
    >
      <div className="aspect-[2/3] bg-gray-900 flex items-center justify-center overflow-hidden relative">
        {item.tvgLogo ? (
          <img 
            src={item.tvgLogo} 
            alt={item.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://via.placeholder.com/300x450?text=${encodeURIComponent(item.name)}`;
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-gray-700 p-4">
            {item.category === 'CHANNEL' ? <Tv size={48} className="opacity-20" /> : <Film size={48} className="opacity-20" />}
            <div className="text-gray-500 font-bold text-sm uppercase text-center line-clamp-3">
              {item.name}
            </div>
          </div>
        )}
        
        {/* Favorite Button */}
        <button
          onClick={handleFavorite}
          className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-all z-10 ${
            isFavorite ? 'bg-red-500 text-white' : 'bg-black/40 text-gray-300 hover:bg-black/60'
          }`}
        >
          <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
          <div className="bg-blue-600 p-4 rounded-full shadow-2xl transform scale-50 group-hover:scale-100 transition-transform duration-300">
            <Play className="text-white fill-current ml-0.5" size={28} />
          </div>
        </div>

        {item.category === 'CHANNEL' && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-[10px] font-black text-white rounded uppercase tracking-wider shadow-lg">
            Live
          </div>
        )}
      </div>
      
      <div className="p-3 bg-gray-900/80 backdrop-blur-sm border-t border-gray-800">
        <h3 className="text-sm font-bold text-gray-100 truncate leading-tight mb-1" title={item.name}>
          {item.name}
        </h3>
        {item.groupName && (
          <div className="flex items-center gap-1.5 overflow-hidden">
            <p className="text-[10px] text-gray-500 truncate uppercase font-medium tracking-tight">
              {item.groupName}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
