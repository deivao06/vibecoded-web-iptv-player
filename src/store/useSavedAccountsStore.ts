import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SavedPlaylist } from '../types/playlist';

interface SavedAccountsState {
  savedPlaylists: SavedPlaylist[];
  activePlaylistId: string | null;
  addPlaylist: (playlist: Omit<SavedPlaylist, 'id'>) => void;
  removePlaylist: (id: string) => void;
  setActivePlaylist: (id: string | null) => void;
}

export const useSavedAccountsStore = create<SavedAccountsState>()(
  persist(
    (set) => ({
      savedPlaylists: [],
      activePlaylistId: null,

      addPlaylist: (playlistData) => {
        const id = crypto.randomUUID();
        const newPlaylist = { ...playlistData, id };
        set((state) => ({
          savedPlaylists: [...state.savedPlaylists, newPlaylist],
          activePlaylistId: id, // Seleciona automaticamente a nova lista
        }));
      },

      removePlaylist: (id) => {
        set((state) => ({
          savedPlaylists: state.savedPlaylists.filter((p) => p.id !== id),
          activePlaylistId: state.activePlaylistId === id ? null : state.activePlaylistId,
        }));
      },

      setActivePlaylist: (id) => {
        set({ activePlaylistId: id });
      },
    }),
    {
      name: 'iptv-saved-accounts',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
