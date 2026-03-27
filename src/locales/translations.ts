export const translations = {
  pt: {
    common: {
      slogan: 'Stream com poder',
      search: 'Buscar nesta categoria...',
      loading: 'Sincronizando biblioteca...',
      errorTitle: 'Erro de Conexão',
      tryAgain: 'Tentar Novamente',
      total: 'Total',
      perPage: 'por página',
      page: 'Página',
      of: 'de',
      lastUpdated: 'Sincronizado em',
      noItems: 'Nenhum item encontrado nesta categoria.',
      save: 'Entrar',
      saveName: 'Nome p/ Salvar',
      m3uUrl: 'URL da lista',
      xtreamServer: 'http://servidor.com',
      username: 'Usuário',
      password: 'Senha',
      connectToStart: 'Conecte-se para começar',
      chooseMethod: 'Escolha o método acima e insira suas credenciais.',
      version: 'IPTV Web Player v1.0',
      footer: 'IPTV Web Player — M3U & Xtream Codes API'
    },
    menu: {
      library: 'Biblioteca',
      favorites: 'Favoritos',
      recent: 'Recentes',
      content: 'Conteúdo',
      channels: 'Canais ao Vivo',
      movies: 'Filmes VOD',
      series: 'Séries'
    },
    playlists: {
      yourLists: 'Suas Listas',
      savedLists: 'Listas Salvas',
      remove: 'Remover lista'
    },
    series: {
      seasons: 'Temporadas',
      episodes: 'episódios',
      season: 'Temporada',
      eps: 'eps',
      synopsis: 'Sinopse',
      cast: 'Elenco',
      director: 'Diretor',
      noSynopsis: 'Nenhuma sinopse disponível.',
      noEpisodes: 'Nenhum episódio encontrado.',
      episode: 'Episódio'
    },
    player: {
      playing: 'Reproduzindo',
      close: 'Fechar',
      live: 'Ao Vivo',
      errorTitle: 'Ops! Algo deu errado',
      backToList: 'Voltar para a lista',
      syncing: 'Sincronizando stream...',
      errorMsg: 'Não foi possível carregar o vídeo. Verifique sua conexão ou se o link ainda está ativo.'
    }
  },
  en: {
    common: {
      slogan: 'Stream with power',
      search: 'Search in this category...',
      loading: 'Syncing library...',
      errorTitle: 'Connection Error',
      tryAgain: 'Try Again',
      total: 'Total',
      perPage: 'per page',
      page: 'Page',
      of: 'of',
      lastUpdated: 'Synced at',
      noItems: 'No items found in this category.',
      save: 'Login',
      saveName: 'Name to Save',
      m3uUrl: 'Playlist URL',
      xtreamServer: 'http://server.com',
      username: 'Username',
      password: 'Password',
      connectToStart: 'Connect to start',
      chooseMethod: 'Choose the method above and enter your credentials.',
      version: 'IPTV Web Player v1.0',
      footer: 'IPTV Web Player — M3U & Xtream Codes API'
    },
    menu: {
      library: 'Library',
      favorites: 'Favorites',
      recent: 'Recent',
      content: 'Content',
      channels: 'Live Channels',
      movies: 'VOD Movies',
      series: 'Series'
    },
    playlists: {
      yourLists: 'Your Lists',
      savedLists: 'Saved Lists',
      remove: 'Remove playlist'
    },
    series: {
      seasons: 'Seasons',
      episodes: 'episodes',
      season: 'Season',
      eps: 'eps',
      synopsis: 'Synopsis',
      cast: 'Cast',
      director: 'Director',
      noSynopsis: 'No synopsis available.',
      noEpisodes: 'No episodes found.',
      episode: 'Episode'
    },
    player: {
      playing: 'Playing',
      close: 'Close',
      live: 'Live',
      errorTitle: 'Oops! Something went wrong',
      backToList: 'Back to list',
      syncing: 'Syncing stream...',
      errorMsg: 'Could not load the video. Check your connection or if the link is still active.'
    }
  }
};

export type Language = 'pt' | 'en';
export type TranslationKeys = typeof translations.pt;
