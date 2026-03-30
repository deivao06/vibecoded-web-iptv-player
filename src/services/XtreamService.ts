import axios from 'axios';
import type { PlaylistItem, XtreamCredentials } from '../types/playlist';

export class XtreamService {
  private static getProxyUrl(url: string): string {
    const isDev = import.meta.env.DEV;
    const customProxy = import.meta.env.VITE_PROXY_URL;

    if (isDev) {
      return `/api-proxy?url=${encodeURIComponent(url)}`;
    }

    if (customProxy) {
      // Use o proxy da Cloudflare se a variável estiver definida
      return `${customProxy}${encodeURIComponent(url)}`;
    }

    return url;
  }

  static async loginCheck(creds: XtreamCredentials): Promise<boolean> {
    const baseUrl = creds.url.endsWith('/') ? creds.url.slice(0, -1) : creds.url;
    const apiBase = `${baseUrl}/player_api.php?username=${creds.username}&password=${creds.password}`;
    
    try {
      const loginRes = await axios.get(this.getProxyUrl(apiBase), { timeout: 60000 });
      return loginRes.data?.user_info?.status === 'Active';
    } catch (error) {
      console.error('Login check failed:', error);
      return false;
    }
  }

  private static normalizeToArray(data: any): any[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      // Alguns servidores retornam objetos com chaves numéricas
      return Object.values(data);
    }
    return [];
  }

  static async fetchChannels(creds: XtreamCredentials): Promise<PlaylistItem[]> {
    const baseUrl = creds.url.endsWith('/') ? creds.url.slice(0, -1) : creds.url;
    const apiBase = `${baseUrl}/player_api.php?username=${creds.username}&password=${creds.password}`;
    
    const response = await axios.get(this.getProxyUrl(`${apiBase}&action=get_live_streams`), { timeout: 180000 });
    const data = this.normalizeToArray(response.data);
    
    return data.map((item: any) => ({
      id: `channel-${item.stream_id}`,
      name: item.name,
      url: `${baseUrl}/live/${creds.username}/${creds.password}/${item.stream_id}.ts`,
      category: 'CHANNEL',
      tvgLogo: item.stream_icon,
      groupName: item.category_name,
      streamId: item.stream_id
    }));
  }

  static async fetchMovies(creds: XtreamCredentials): Promise<PlaylistItem[]> {
    const baseUrl = creds.url.endsWith('/') ? creds.url.slice(0, -1) : creds.url;
    const apiBase = `${baseUrl}/player_api.php?username=${creds.username}&password=${creds.password}`;
    
    const response = await axios.get(this.getProxyUrl(`${apiBase}&action=get_vod_streams`), { timeout: 180000 });
    const data = this.normalizeToArray(response.data);
    
    return data.map((item: any) => ({
      id: `movie-${item.stream_id}`,
      name: item.name,
      url: `${baseUrl}/movie/${creds.username}/${creds.password}/${item.stream_id}.${item.container_extension || 'mp4'}`,
      category: 'MOVIE',
      tvgLogo: item.stream_icon,
      groupName: item.category_name,
      streamId: item.stream_id,
      containerExtension: item.container_extension
    }));
  }

  static async fetchSeries(creds: XtreamCredentials): Promise<PlaylistItem[]> {
    const baseUrl = creds.url.endsWith('/') ? creds.url.slice(0, -1) : creds.url;
    const apiBase = `${baseUrl}/player_api.php?username=${creds.username}&password=${creds.password}`;
    
    const response = await axios.get(this.getProxyUrl(`${apiBase}&action=get_series`), { timeout: 180000 });
    const data = this.normalizeToArray(response.data);
    
    return data.map((item: any) => ({
      id: `series-${item.series_id}`,
      name: item.name,
      url: `${baseUrl}/series/${creds.username}/${creds.password}/${item.series_id}`,
      category: 'SERIES',
      tvgLogo: item.cover,
      groupName: item.category_name,
      streamId: item.series_id,
      seriesId: item.series_id
    }));
  }

  static async fetchSeriesInfo(creds: XtreamCredentials, seriesId: string): Promise<import('../types/playlist').SeriesDetail> {
    const baseUrl = creds.url.endsWith('/') ? creds.url.slice(0, -1) : creds.url;
    const apiBase = `${baseUrl}/player_api.php?username=${creds.username}&password=${creds.password}&action=get_series_info&series_id=${seriesId}`;
    
    const response = await axios.get(this.getProxyUrl(apiBase), { timeout: 60000 });
    const data = response.data;
    
    const seasonsMap: Record<number, import('../types/playlist').Episode[]> = {};
    
    if (data.episodes) {
      Object.keys(data.episodes).forEach(seasonNum => {
        const episodes = data.episodes[seasonNum];
        const n = parseInt(seasonNum);
        seasonsMap[n] = episodes.map((ep: any) => ({
          id: ep.id,
          title: ep.title,
          containerExtension: ep.container_extension,
          seasonNumber: parseInt(ep.season),
          episodeNumber: parseInt(ep.episode_num),
          url: `${baseUrl}/series/${creds.username}/${creds.password}/${ep.id}.${ep.container_extension}`,
          info: ep.info
        }));
      });
    }

    const seasons: import('../types/playlist').Season[] = Object.keys(seasonsMap)
      .map(num => ({
        number: parseInt(num),
        episodes: seasonsMap[parseInt(num)].sort((a, b) => a.episodeNumber - b.episodeNumber)
      }))
      .sort((a, b) => a.number - b.number);

    return {
      info: {
        name: data.info.name || '',
        cover: data.info.cover || '',
        plot: data.info.plot || '',
        cast: data.info.cast || '',
        director: data.info.director || '',
        genre: data.info.genre || '',
        releaseDate: data.info.releaseDate || '',
        rating: data.info.rating || '',
      },
      seasons
    };
  }
}
