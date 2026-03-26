import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import type { PlaylistItem, XtreamCredentials, ItemCategory } from '../types/playlist';
import { M3UParserService } from '../services/M3UParserService';
import { XtreamService } from '../services/XtreamService';

interface CategoryStatus {
  isLoading: boolean;
  error: string | null;
}

interface PlaylistState {
  items: PlaylistItem[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  currentSource: string | null;
  currentCredentials: XtreamCredentials | null;
  status: Record<ItemCategory, CategoryStatus>;
  
  loadPlaylist: (url: string, forceRefresh?: boolean) => Promise<boolean>;
  loginXtream: (creds: XtreamCredentials, forceRefresh?: boolean) => Promise<boolean>;
  fetchCategory: (category: ItemCategory, forceRefresh?: boolean) => Promise<void>;
  getChannels: () => PlaylistItem[];
  getMovies: () => PlaylistItem[];
  getSeries: () => PlaylistItem[];
  clearCache: () => void;
}

// Custom storage usando IndexedDB compatível com as tipos do Zustand
const idbStorage: PersistStorage<PlaylistState> = {
  getItem: async (name) => {
    const value = await idbGet<string>(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: async (name, value) => {
    await idbSet(name, JSON.stringify(value));
  },
  removeItem: async (name) => {
    await idbDel(name);
  },
};

// Helper para garantir unicidade global de itens
const deduplicate = (items: PlaylistItem[]) => {
  const map = new Map<string, PlaylistItem>();
  items.forEach(item => {
    if (item && item.id) map.set(item.id, item);
  });
  return Array.from(map.values());
};

const CACHE_VALIDITY = 24 * 60 * 60 * 1000;

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,
      lastUpdated: null,
      currentSource: null,
      currentCredentials: null,
      status: {
        CHANNEL: { isLoading: false, error: null },
        MOVIE: { isLoading: false, error: null },
        SERIES: { isLoading: false, error: null },
      },

      loadPlaylist: async (url: string, forceRefresh = false) => {
        const state = get();
        if (!forceRefresh && state.items.length > 0 && state.currentSource === url && state.lastUpdated && (Date.now() - state.lastUpdated < CACHE_VALIDITY)) {
          // Mesmo no cache, garantimos que não há duplicatas
          set({ items: deduplicate(state.items) });
          return true;
        }

        // Limpa itens se a fonte for diferente
        if (state.currentSource !== url) {
          set({ items: [], status: {
            CHANNEL: { isLoading: false, error: null },
            MOVIE: { isLoading: false, error: null },
            SERIES: { isLoading: false, error: null },
          }});
        }

        set({ isLoading: true, error: null, currentSource: url, currentCredentials: null });
        try {
          const items = await M3UParserService.fetchAndParse(url);
          set({ 
            items: deduplicate(items), 
            isLoading: false, 
            lastUpdated: Date.now(),
            status: {
              CHANNEL: { isLoading: false, error: null },
              MOVIE: { isLoading: false, error: null },
              SERIES: { isLoading: false, error: null },
            }
          });
          return true;
        } catch (error) {
          set({ error: 'Falha ao carregar a lista M3U.', isLoading: false });
          return false;
        }
      },

      loginXtream: async (creds: XtreamCredentials, forceRefresh = false) => {
        const state = get();
        const sourceKey = `${creds.url}|${creds.username}`;

        if (!forceRefresh && state.items.length > 0 && state.currentSource === sourceKey && state.lastUpdated && (Date.now() - state.lastUpdated < CACHE_VALIDITY)) {
          // Limpa cache antes de disparar as categorias
          set({ items: deduplicate(state.items) });
          get().fetchCategory('CHANNEL', false);
          get().fetchCategory('MOVIE', false);
          get().fetchCategory('SERIES', false);
          return true;
        }

        if (state.currentSource !== sourceKey) {
          set({ items: [], status: {
            CHANNEL: { isLoading: false, error: null },
            MOVIE: { isLoading: false, error: null },
            SERIES: { isLoading: false, error: null },
          }});
        }

        set({ isLoading: true, error: null });
        const success = await XtreamService.loginCheck(creds);
        
        if (!success) {
          set({ error: 'Falha no login Xtream Codes. Verifique os dados.', isLoading: false });
          return false;
        }

        set({ isLoading: false, currentSource: sourceKey, currentCredentials: creds });
        get().fetchCategory('CHANNEL', forceRefresh);
        get().fetchCategory('MOVIE', forceRefresh);
        get().fetchCategory('SERIES', forceRefresh);
        return true;
      },

      fetchCategory: async (category: ItemCategory, forceRefresh = false) => {
        const state = get();
        const creds = state.currentCredentials;
        if (!creds) return;

        if (state.status[category].isLoading) return;

        const hasItems = state.items.some(i => i.category === category);
        if (!forceRefresh && hasItems && state.lastUpdated && (Date.now() - state.lastUpdated < CACHE_VALIDITY)) {
          // Garante que a lista atual está limpa mesmo vindo do cache
          set({ items: deduplicate(state.items) });
          return;
        }

        set((s) => ({ status: { ...s.status, [category]: { isLoading: true, error: null } } }));

        try {
          let newItems: PlaylistItem[] = [];
          if (category === 'CHANNEL') newItems = await XtreamService.fetchChannels(creds);
          else if (category === 'MOVIE') newItems = await XtreamService.fetchMovies(creds);
          else if (category === 'SERIES') newItems = await XtreamService.fetchSeries(creds);

          set((s) => ({
            items: deduplicate([...s.items.filter(i => i.category !== category), ...newItems]),
            lastUpdated: Date.now(),
            status: { ...s.status, [category]: { isLoading: false, error: null } }
          }));
        } catch (err) {
          set((s) => ({ status: { ...s.status, [category]: { isLoading: false, error: 'Erro de Timeout/Rede' } } }));
        }
      },

      getChannels: () => {
        const { items } = get();
        return items.filter(item => item.category === 'CHANNEL');
      },
      getMovies: () => {
        const { items } = get();
        return items.filter(item => item.category === 'MOVIE');
      },
      getSeries: () => {
        const { items } = get();
        return items.filter(item => item.category === 'SERIES');
      },
      clearCache: () => set({ items: [], lastUpdated: null, currentSource: null, currentCredentials: null })
    }),
    {
      name: 'iptv-content-cache',
      storage: idbStorage,
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Limpa o estado hidratado para garantir que não existam duplicatas vindas do disco
          state.items = deduplicate(state.items || []);
        }
      },
      partialize: (state) => ({ 
        items: state.items, 
        lastUpdated: state.lastUpdated, 
        currentSource: state.currentSource,
        currentCredentials: state.currentCredentials
      } as PlaylistState),
    }
  )
);
