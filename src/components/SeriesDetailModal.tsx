import React, { useState, useEffect } from 'react';
import { X, Play, Info, Calendar, Star, List, ChevronDown } from 'lucide-react';
import { XtreamService } from '../services/XtreamService';
import { useLanguageStore } from '../store/useLanguageStore';
import type { PlaylistItem, SeriesDetail, Episode, XtreamCredentials } from '../types/playlist';

interface SeriesDetailModalProps {
  series: PlaylistItem;
  credentials: XtreamCredentials;
  onClose: () => void;
  onPlayEpisode: (episode: Episode) => void;
}

export const SeriesDetailModal: React.FC<SeriesDetailModalProps> = ({ series, credentials, onClose, onPlayEpisode }) => {
  const [detail, setDetail] = useState<SeriesDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSeason, setActiveSeason] = useState<number>(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { t } = useLanguageStore();

  // Trava o scroll do body ao abrir o modal
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen && !(event.target as Element).closest('.season-dropdown')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  useEffect(() => {
    const loadDetail = async () => {
      // Tenta pegar o ID de seriesId, streamId ou extrair do ID interno
      const id = series.seriesId || series.streamId || series.id.replace('series-', '');
      
      if (!id) {
        setError('ID not found');
        setLoading(false);
        return;
      }

      try {
        const data = await XtreamService.fetchSeriesInfo(credentials, id);
        setDetail(data);
        if (data.seasons.length > 0) {
          setActiveSeason(data.seasons[0].number);
        }
      } catch (err) {
        setError('Failed to load series details');
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [series, credentials]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-senju-light mx-auto mb-4"></div>
          <p className="text-gray-400 font-medium">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
        <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 text-center max-w-md w-full shadow-2xl">
          <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">{t.common.errorTitle}</h3>
          <p className="text-gray-400 mb-6">{error || 'Series not found'}</p>
          <button onClick={onClose} className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all font-semibold">{t.player.close}</button>
        </div>
      </div>
    );
  }

  const currentSeason = detail.seasons.find(s => s.number === activeSeason);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-0 sm:p-4 md:p-6 lg:p-10">
      <div className="bg-gray-900 w-full max-w-7xl h-full sm:h-auto sm:max-h-[90vh] sm:rounded-3xl overflow-hidden shadow-2xl border-0 sm:border border-gray-800 flex flex-col md:flex-row relative">
        <button 
          onClick={onClose}
          className="fixed sm:absolute top-4 right-4 z-[60] p-2 bg-black/60 hover:bg-senju-light rounded-full text-white hover:text-senju-dark transition-all border border-white/10 shadow-xl"
        >
          <X size={24} />
        </button>

        {/* Poster & Info Sidebar */}
        <div className="w-full md:w-[300px] lg:w-[350px] bg-gray-950 flex flex-col border-b md:border-b-0 md:border-r border-gray-800 shrink-0 overflow-y-auto md:max-h-none max-h-[40vh] custom-scrollbar">
          <div className="relative aspect-video md:aspect-[2/3] w-full overflow-hidden bg-gray-900 shrink-0">
            <img 
              src={detail.info.cover || series.tvgLogo} 
              alt={detail.info.name} 
              className="w-full h-full object-cover"
              onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450?text=Sem+Capa'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent md:hidden" />
          </div>
          
          <div className="p-4 md:p-6 lg:p-8 space-y-4 -mt-8 md:mt-0 relative z-10">
            <h2 className="text-xl lg:text-2xl font-bold text-white leading-tight">{detail.info.name}</h2>
            
            <div className="flex flex-wrap gap-1.5">
              {detail.info.rating && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded-lg text-[10px] font-bold border border-yellow-500/20">
                  <Star size={10} fill="currentColor" /> {detail.info.rating}
                </div>
              )}
              {detail.info.releaseDate && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-senju-light/10 text-senju-light rounded-lg text-[10px] font-bold border border-senju-light/20">
                  <Calendar size={10} /> {detail.info.releaseDate}
                </div>
              )}
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-gray-500">
                  <Info size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t.series.synopsis}</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-4 md:line-clamp-none">{detail.info.plot || t.series.noSynopsis}</p>
              </div>
              
              {(detail.info.cast || detail.info.director) && (
                <div className="grid grid-cols-1 gap-3 pt-2 border-t border-gray-800/50">
                  {detail.info.cast && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest block">{t.series.cast}</span>
                      <p className="text-[10px] text-gray-500 leading-tight line-clamp-2">{detail.info.cast}</p>
                    </div>
                  )}
                  {detail.info.director && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest block">{t.series.director}</span>
                      <p className="text-[10px] text-gray-500">{detail.info.director}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Seasons & Episodes */}
        <div className="flex-1 flex flex-col min-h-0 bg-gray-900/30">
          {/* Season Selector */}
          <div className="p-3 md:p-4 lg:p-6 bg-gray-900/50 border-b border-gray-800 shrink-0 flex flex-row items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-gray-400">
              <List size={18} className="text-senju-light" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{t.series.seasons}</span>
            </div>
            
            <div className="relative flex-1 season-dropdown">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full bg-gray-800/80 hover:bg-gray-800 border ${isDropdownOpen ? 'border-senju-light ring-2 ring-senju-light/20' : 'border-gray-700'} text-white text-xs font-bold rounded-xl pl-4 pr-10 py-3 flex items-center justify-between transition-all shadow-lg`}
              >
                <span className="truncate">
                  {t.series.season} {activeSeason} • {currentSeason?.episodes.length || 0} {t.series.episodes}
                </span>
                <ChevronDown 
                  size={16} 
                  strokeWidth={2.5} 
                  className={`text-senju-light transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-[70] animate-in fade-in zoom-in duration-200 origin-top">
                  <div className="max-h-[250px] overflow-y-auto custom-scrollbar p-1">
                    {detail.seasons.map((season) => (
                      <div
                        key={season.number}
                        onClick={() => {
                          setActiveSeason(season.number);
                          setIsDropdownOpen(false);
                        }}
                        className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all mb-0.5 last:mb-0 ${
                          activeSeason === season.number 
                            ? 'bg-senju-dark text-senju-light' 
                            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{t.series.season} {season.number}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                            activeSeason === season.number ? 'bg-white/20' : 'bg-gray-900 text-gray-500'
                          }`}>
                            {season.episodes.length}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Episode List */}
          <div className="flex-1 overflow-y-auto p-3 md:p-6 lg:p-8 space-y-3 custom-scrollbar">
            {currentSeason ? (
              currentSeason.episodes.map((ep) => (
                <div 
                  key={ep.id}
                  onClick={() => onPlayEpisode(ep)}
                  className="group flex items-stretch gap-3 p-2 bg-gray-800/30 hover:bg-gray-800/60 rounded-xl border border-gray-800/50 hover:border-senju-light/50 cursor-pointer transition-all"
                >
                  <div className="w-24 sm:w-32 md:w-40 lg:w-44 aspect-video rounded-lg overflow-hidden bg-gray-950 relative shrink-0 shadow-lg">
                    <img 
                      src={ep.info?.movie_image || detail.info.cover} 
                      alt={ep.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/160x90?text=Sem+Imagem'}
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="bg-senju-light p-2 rounded-full scale-90 group-hover:scale-100 transition-transform shadow-2xl">
                        <Play size={14} fill="currentColor" className="text-senju-dark ml-0.5" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-senju-light font-mono text-[8px] font-black px-1.5 py-0.5 bg-senju-light/10 rounded border border-senju-light/20 uppercase">
                        EP {ep.episodeNumber}
                      </span>
                      <h4 className="text-white font-bold truncate group-hover:text-senju-light transition-colors text-xs sm:text-sm">{ep.title}</h4>
                    </div>
                    {ep.info?.plot ? (
                      <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed italic hidden sm:block">{ep.info.plot}</p>
                    ) : (
                      <p className="text-[10px] text-gray-500 hidden sm:block">{t.series.episode} {ep.episodeNumber}.</p>
                    )}
                    
                    {ep.info?.duration && (
                      <div className="mt-1 text-[9px] font-bold text-gray-600 uppercase flex items-center gap-1">
                        <Clock size={8} /> {ep.info.duration}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 py-10">
                <div className="p-4 bg-gray-800/30 rounded-full mb-3">
                  <List size={32} className="opacity-20" />
                </div>
                <p className="text-xs font-medium">{t.series.noEpisodes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Clock = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
