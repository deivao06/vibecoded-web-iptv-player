import React, { useEffect, useRef, useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import Hls from 'hls.js';
import mpegts from 'mpegts.js';

interface VideoPlayerProps {
  url: string;
  title: string;
  onClose: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setError(null);

    let hlsInstance: Hls | null = null;
    let mpegtsPlayer: mpegts.Player | null = null;

    const urlLower = url.toLowerCase();
    const isTS = urlLower.endsWith('.ts') || urlLower.includes('.ts?') || (urlLower.includes('live') && urlLower.includes('fistfast') && !urlLower.includes('.mp4') && !urlLower.includes('.mkv'));
    const isHLS = urlLower.includes('.m3u8');

    if (isTS && mpegts.getFeatureList().mseLivePlayback) {
      // Suporte para MPEG-TS (Canais ao vivo)
      try {
        mpegtsPlayer = mpegts.createPlayer({
          type: 'mse',
          isLive: true,
          url: url,
          cors: true
        }, {
          enableWorker: true,
          enableStashBuffer: false,
          stashInitialSize: 128,
          autoCleanupSourceBuffer: true
        });
        
        mpegtsPlayer.attachMediaElement(video);
        mpegtsPlayer.load();
        
        const currentMpegtsPlayer = mpegtsPlayer;
        setTimeout(() => {
          if (currentMpegtsPlayer && video && typeof currentMpegtsPlayer.play === 'function') {
            currentMpegtsPlayer.play().catch(e => {
              if (e.name !== 'AbortError') {
                console.warn('Falha ao iniciar mpegts, tentando nativo:', e);
                video.src = url;
              }
            });
          }
        }, 200);

        mpegtsPlayer.on(mpegts.Events.ERROR, (type, detail) => {
          console.error('Erro mpegts:', type, detail);
          if (detail === mpegts.ErrorDetails.FORMAT_UNSUPPORTED) {
            // Se o formato não for TS, tenta o nativo imediatamente
            if (video) video.src = url;
          } else if (video && !video.src) {
            video.src = url;
          }
        });

      } catch (e) {
        console.error('Falha ao criar mpegts:', e);
        video.src = url;
      }
    } else if (isHLS) {
      // Suporte para HLS (.m3u8)
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
      } else if (Hls.isSupported()) {
        hlsInstance = new Hls();
        hlsInstance.loadSource(url);
        hlsInstance.attachMedia(video);
        hlsInstance.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) setError('Erro fatal ao carregar o stream HLS.');
        });
      }
    } else {
      // Outros formatos (MP4, etc)
      video.src = url;
    }

    const handleCanPlay = () => setLoading(false);
    const handleError = () => {
      setLoading(false);
      setError('Não foi possível carregar o vídeo. Verifique sua conexão ou se o link ainda está ativo.');
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      
      if (hlsInstance) {
        hlsInstance.destroy();
      }
      if (mpegtsPlayer) {
        mpegtsPlayer.unload();
        mpegtsPlayer.detachMediaElement();
        mpegtsPlayer.destroy();
      }
    };
  }, [url]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-2 md:p-6 lg:p-12 animate-in fade-in duration-300">
      <div className="relative w-full max-w-6xl max-h-full aspect-video bg-gray-900 rounded-2xl md:rounded-3xl overflow-hidden flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.7)] border border-gray-800 group">
        
        {/* Header - Aparece no hover */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 md:p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent text-white opacity-0 group-hover:opacity-100 transition-all duration-500 transform -translate-y-2 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto">
          <h3 className="text-lg md:text-xl font-bold truncate pr-12 drop-shadow-md">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2.5 bg-black/40 hover:bg-red-500 rounded-full transition-all border border-white/10 backdrop-blur-md"
            aria-label="Fechar player"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Video Area */}
        <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
          {loading && !error && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-950">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-400 font-medium animate-pulse">Sincronizando stream...</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-950 p-6 text-center">
              <div className="bg-red-500/10 p-4 rounded-full mb-4 border border-red-500/20">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Ops! Algo deu errado</h4>
              <p className="text-gray-400 max-w-md mx-auto mb-6">{error}</p>
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold transition-all border border-gray-700 shadow-xl"
              >
                Voltar para a lista
              </button>
            </div>
          )}

          <video
            ref={videoRef}
            className="w-full h-full object-contain cursor-pointer"
            controls
            autoPlay
            playsInline
          />
        </div>

        {/* Floating Play Indicator for Live - Ajustado para não cobrir controles */}
        {url.toLowerCase().includes('.ts') && !loading && !error && (
          <div className="absolute top-20 left-6 z-20 flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Ao Vivo
          </div>
        )}
      </div>
    </div>
  );
};
