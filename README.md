# IPTV Player Web (Self-Hosted)

Um player de IPTV web moderno, responsivo e focado em privacidade, projetado para ser rodado localmente ou em seu próprio servidor. Suporta listas M3U e Xtream API.

## 🚀 Características

- **Self-Hosted:** Tenha total controle sobre sua instância.
- **Proxy Integrado:** Resolve problemas de CORS e permite carregar conteúdos de provedores que bloqueiam navegadores.
- **Suporte a Canais, Filmes e Séries:** Organização automática baseada na sua lista.
- **Interface Responsiva:** Otimizado para desktop, tablets e mobile.
- **Docker Ready:** Deploy fácil e rápido com Docker Compose.
- **Privacidade:** Suas listas e dados são salvos apenas no seu navegador (IndexedDB).

## 🛠️ Como Rodar (Self-Host)

### Opção 1: Docker (Recomendado)

Certifique-se de ter o [Docker](https://docs.docker.com/get-docker/) e o [Docker Compose](https://docs.docker.com/compose/install/) instalados.

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/iptv-player.git
   cd iptv-player
   ```

2. Inicie o container:
   ```bash
   docker-compose up -d
   ```

3. Acesse em seu navegador:
   `http://localhost:5173`

### Opção 2: Localmente (Node.js)

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Inicie o servidor de desenvolvimento (com proxy):
   ```bash
   npm run dev
   ```

3. Acesse:
   `http://localhost:5173`

## 📡 Sobre o Proxy

Este projeto inclui um proxy integrado para garantir que o conteúdo seja carregado corretamente:
- **CORS:** Muitos provedores de IPTV não permitem acesso direto via navegador. O proxy injeta os headers necessários.
- **User-Agent:** Alguns servidores bloqueiam requisições de navegadores comuns. O proxy mascara a requisição para garantir a compatibilidade.
- **HTTPS/HTTP:** Permite carregar conteúdo HTTP mesmo se você estiver rodando em uma rede local, evitando avisos de conteúdo misto em muitos casos.

## 🛠️ Stack Tecnológica

- **Frontend:** React 19, TypeScript
- **Estilização:** TailwindCSS
- **Gerenciamento de Estado:** Zustand
- **Banco de Dados Local:** IndexedDB (via idb-keyval)
- **Player:** ReactPlayer & HLS.js
- **Build Tool:** Vite

## 📄 Licença

Este projeto é para fins de aprendizado. Certifique-se de ter o direito de acessar os conteúdos das listas que você utiliza.
