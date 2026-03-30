import axios from 'axios';
import { parse } from 'iptv-playlist-parser';
import type { PlaylistItem, ItemCategory } from '../types/playlist';
import { getProxyUrl } from '../utils/proxy';

export class M3UParserService {
  static async fetchAndParse(url: string): Promise<PlaylistItem[]> {
    try {
      // Proxy condicional (Timeout 180s)
      const response = await axios.get(getProxyUrl(url), { timeout: 180000 });
      const m3uContent = response.data;
      const parsed = parse(m3uContent);

      return parsed.items.map((item, index) => {
        const category = this.determineCategory(item.group.title, item.name);
        return {
          id: item.tvg.id || `item-${index}`,
          name: item.name,
          url: item.url,
          category,
          tvgId: item.tvg.id,
          tvgLogo: item.tvg.logo,
          groupName: item.group.title,
        };
      });
    } catch (error) {
      console.error('Error fetching/parsing M3U:', error);
      throw error;
    }
  }

  private static determineCategory(groupName: string, name: string): ItemCategory {
    const combined = `${groupName} ${name}`.toLowerCase();
    
    const movieKeywords = ['filme', 'movie', 'cinema', 'vod', 'pfc'];
    const seriesKeywords = ['série', 'series', 'episódio', 'season', 'temporada'];

    if (seriesKeywords.some(keyword => combined.includes(keyword))) {
      return 'SERIES';
    }
    
    if (movieKeywords.some(keyword => combined.includes(keyword))) {
      return 'MOVIE';
    }
    
    return 'CHANNEL';
  }
}
