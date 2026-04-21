import Dexie from 'dexie';

export class VisioStreamDB extends Dexie {
  constructor() {
    super('visiosteamDB');
    
    this.version(3).stores({
      channels: '++id, name, group',
      epg: '++id, channelId, start, stop',
      movies: '++id, stream_id, name, category',
      series: '++id, series_id, name',
      episodes: '++id, series_id, season_num, episode_num',
      tmdbCache: '++id, tmdbId, type' // Caché de TMDB para evitar repetir llamadas
    });

    this.channels = this.table('channels');
    this.epg = this.table('epg');
    this.movies = this.table('movies');
    this.series = this.table('series');
    this.episodes = this.table('episodes');
    this.tmdbCache = this.table('tmdbCache');
  }
}

export const db = new VisioStreamDB();
