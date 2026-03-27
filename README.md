# vibecoded-web-iptv-player

A vibe-coded web iptv player using Gemini-CLI.

## Overview
This is a modern, responsive Web IPTV Player built with React, TypeScript, and TailwindCSS. It supports both M3U playlists and Xtream Codes API, allowing users to watch live channels, movies, and series directly in their browser. The project was developed with a focus on clean code and performance, utilizing Gemini-CLI for rapid prototyping and implementation.

## Features
- Support for M3U Playlists and Xtream Codes API.
- Organized library: Live Channels, VOD Movies, and Series.
- Detailed Series View: Season and episode selection with plot information.
- Favorites System: Save your most-watched content.
- History: Quickly access recently viewed items.
- Advanced Search: Filter content by name or group.
- Custom Pagination: Choose between 6, 12, 24, 48, or 96 items per page.
- Responsive Design: Fully compatible with desktop and mobile devices.
- Multi-language Support: Native support for Portuguese and English.
- Optimized Scroll: Independent scrolling for item lists with fixed pagination controls.
- Local Persistence: Saved playlists and preferences are stored locally.

## Tech Stack
- React 19
- TypeScript
- TailwindCSS 4
- Vite
- Zustand (State Management)
- Lucide React (Icons)
- HLS.js and MPEGTS.js (Video Streaming)
- Docker and Docker Compose

## Getting Started

### Prerequisites
- Node.js (v22 or higher recommended)
- Docker and Docker Compose (optional, for containerized deployment)

### Local Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/vibecoded-web-iptv-player.git
   cd vibecoded-web-iptv-player
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

### Docker Deployment
You can run the application using Docker Compose:
```bash
docker-compose up -d
```
The application will be available at http://localhost:3000 by default.

## Development Context
This project was developed using Gemini-CLI, an AI-powered interactive CLI agent. The development process followed high-signal engineering standards, prioritizing technical integrity, responsive aesthetics, and maintainable abstractions.

## License
This project is open-source and available under the MIT License.
