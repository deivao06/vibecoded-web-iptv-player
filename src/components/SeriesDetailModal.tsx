import React, { useState, useEffect } from 'react';
import { X, Play, Info, Calendar, Star, List, ChevronDown } from 'lucide-react';
import { XtreamService } from '../services/XtreamService';
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
        setError('ID da série não encontrado.');
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
        setError('Falha ao carregar detalhes da série.');
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
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 font-medium">Carregando detalhes...</p>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
        <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 text-center max-w-md w-full shadow-2xl">
          <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Erro</h3>
          <p className="text-gray-400 mb-6">{error || 'Série não encontrada'}</p>
          <button onClick={onClose} className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all font-semibold">Fechar</button>
        </div>
      </div>
    );
  }

  const currentSeason = detail.seasons.find(s => s.number === activeSeason);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-2 md:p-6 lg:p-10">
      <div className="bg-gray-900 w-full max-w-7xl h-full max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col md:flex-row relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 bg-black/60 hover:bg-black/90 rounded-full text-white transition-all border border-white/10 shadow-xl"
        >
          <X size={24} />
        </button>

        {/* Poster & Info Sidebar */}
        <div className="w-full md:w-[320px] lg:w-[380px] bg-gray-950 p-6 md:p-8 flex flex-col gap-6 border-b md:border-b-0 md:border-r border-gray-800 overflow-y-auto shrink-0 custom-scrollbar">
          <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-gray-800/50 bg-gray-900 shrink-0">
            <img 
              src={detail.info.cover || series.tvgLogo} 
              alt={detail.info.name} 
              className="w-full h-full object-cover"
              onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450?text=Sem+Capa'}
            />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight">{detail.info.name}</h2>
            
            <div className="flex flex-wrap gap-2">
              {detail.info.rating && (
                <div className="flex items-center gap-1 px-2.5 py-1 bg-yellow-500/10 text-yellow-500 rounded-lg text-xs font-bold border border-yellow-500/20">
                  <Star size={12} fill="currentColor" /> {detail.info.rating}
                </div>
              )}
              {detail.info.releaseDate && (
                <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-bold border border-blue-500/20">
                  <Calendar size={12} /> {detail.info.releaseDate}
                </div>
              )}
              {detail.info.genre && (
                <div className="px-2.5 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-[10px] font-bold border border-purple-500/20 uppercase tracking-wider">
                  {detail.info.genre.split(',')[0]}
                </div>
              )}
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-400">
                  <Info size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">Sinopse</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{detail.info.plot || 'Nenhuma sinopse disponível.'}</p>
              </div>
              
              {detail.info.cast && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Elenco</span>
                  <p className="text-xs text-gray-400 leading-snug">{detail.info.cast}</p>
                </div>
              )}

              {detail.info.director && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Diretor</span>
                  <p className="text-xs text-gray-400">{detail.info.director}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Seasons & Episodes */}
        <div className="flex-1 flex flex-col min-h-0 bg-gray-900/30">
          {/* Season Selector */}
          <div className="p-4 md:p-6 bg-gray-900/50 border-b border-gray-800 shrink-0 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 text-gray-400">
              <List size={20} className="text-blue-500" />
              <span className="text-sm font-bold uppercase tracking-widest">Temporadas</span>
            </div>
            
            <div className="relative flex-1 max-w-sm season-dropdown">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full bg-gray-800/80 hover:bg-gray-800 border ${isDropdownOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-700'} text-white text-sm font-bold rounded-xl pl-4 pr-10 py-3.5 flex items-center justify-between transition-all shadow-lg shadow-black/20`}
              >
                <span>
                  Temporada {activeSeason} • {currentSeason?.episodes.length || 0} episódios
                </span>
                <ChevronDown 
                  size={20} 
                  strokeWidth={2.5} 
                  className={`text-blue-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200 origin-top">
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1.5">
                    {detail.seasons.map((season) => (
                      <div
                        key={season.number}
                        onClick={() => {
                          setActiveSeason(season.number);
                          setIsDropdownOpen(false);
                        }}
                        className={`group flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all mb-1 last:mb-0 ${
                          activeSeason === season.number 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold">Temporada {season.number}</span>
                          <span className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded ${
                            activeSeason === season.number ? 'bg-white/20' : 'bg-gray-900 text-gray-500'
                          }`}>
                            {season.episodes.length} eps
                          </span>
                        </div>
                        {activeSeason === season.number && (
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Episode List */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 custom-scrollbar">
            {currentSeason ? (
              currentSeason.episodes.map((ep) => (
                <div 
                  key={ep.id}
                  onClick={() => onPlayEpisode(ep)}
                  className="group flex flex-col sm:flex-row items-stretch gap-4 p-3 bg-gray-800/30 hover:bg-gray-800/60 rounded-2xl border border-gray-800/50 hover:border-blue-500/50 cursor-pointer transition-all"
                >
                  <div className="w-full sm:w-48 aspect-video rounded-xl overflow-hidden bg-gray-950 relative shrink-0 shadow-lg">
                    <img 
                      src={ep.info?.movie_image || detail.info.cover} 
                      alt={ep.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/160x90?text=Sem+Imagem'}
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="bg-blue-600 p-3 rounded-full scale-90 group-hover:scale-100 transition-transform shadow-2xl">
                        <Play size={18} fill="white" className="text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-500 font-mono text-[10px] font-black px-2 py-0.5 bg-blue-500/10 rounded-md border border-blue-500/20 uppercase">
                        EP {ep.episodeNumber}
                      </span>
                      <h4 className="text-white font-bold truncate group-hover:text-blue-400 transition-colors text-base">{ep.title}</h4>
                    </div>
                    {ep.info?.plot ? (
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed italic">{ep.info.plot}</p>
                    ) : (
                      <p className="text-xs text-gray-500">Episódio {ep.episodeNumber} da Temporada {activeSeason}.</p>
                    )}
                    
                    {ep.info?.duration && (
                      <div className="mt-2 text-[10px] font-bold text-gray-600 uppercase flex items-center gap-1">
                        <Clock size={10} /> {ep.info.duration}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 py-20">
                <div className="p-6 bg-gray-800/30 rounded-full mb-4">
                  <List size={48} className="opacity-20" />
                </div>
                <p className="font-medium">Nenhum episódio encontrado.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Adicionando um pequeno helper para o relógio usado acima
const Clock = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
