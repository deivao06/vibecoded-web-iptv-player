export type ItemCategory = 'CHANNEL' | 'MOVIE' | 'SERIES';

export interface PlaylistItem {
  id: string;
  name: string;
  url: string;
  category: ItemCategory;
  tvgId?: string;
  tvgLogo?: string;
  groupName?: string;
  streamId?: string;
  containerExtension?: string;
  seriesId?: string;
}

export interface Episode {
  id: string;
  title: string;
  containerExtension: string;
  seasonNumber: number;
  episodeNumber: number;
  url: string;
  info?: {
    movie_image?: string;
    plot?: string;
    duration?: string;
    rating?: string;
  };
}

export interface Season {
  number: number;
  episodes: Episode[];
}

export interface SeriesDetail {
  info: {
    name: string;
    cover: string;
    plot: string;
    cast: string;
    director: string;
    genre: string;
    releaseDate: string;
    rating: string;
  };
  seasons: Season[];
}

export interface XtreamCredentials {
  url: string;
  username: string;
  password: string;
}

export interface SavedPlaylist {
  id: string;
  name: string;
  type: 'M3U' | 'XTREAM';
  data: string | XtreamCredentials; // URL para M3U ou Credenciais para Xtream
  lastUpdated?: number;
}
