import { db } from '../db/channelDB';

const TMDB_API_KEY = 'TU_API_KEY_AQUI'; // Regístrate en https://www.themoviedb.org/settings/api
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Cache de promesas en memoria para evitar múltiples llamadas simultáneas
const pendingRequests = new Map();

async function fetchFromTMDB(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.append('api_key', TMDB_API_KEY);
  url.searchParams.append('language', 'es-ES');
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  
  const cacheKey = url.toString();
  if (pendingRequests.has(cacheKey)) return pendingRequests.get(cacheKey);
  
  const promise = fetch(url).then(res => res.json()).catch(e => {
    console.warn('TMDB fetch error:', e);
    return null;
  });
  pendingRequests.set(cacheKey, promise);
  return promise;
}

export async function enrichMovieMetadata(movie) {
  if (!movie.name) return movie;
  
  // Buscar en caché local
  const cached = await db.tmdbCache.where({ tmdbId: movie.stream_id, type: 'movie' }).first();
  if (cached) return { ...movie, ...cached.data };

  // Buscar en TMDB por título + año
  const searchParams = { query: movie.name };
  if (movie.year) searchParams.year = movie.year;
  
  const searchRes = await fetchFromTMDB('/search/movie', searchParams);
  if (!searchRes?.results?.length) return movie;
  
  const tmdbMovie = searchRes.results[0];
  const details = await fetchFromTMDB(`/movie/${tmdbMovie.id}`);
  
  const enriched = {
    ...movie,
    poster_path: details.poster_path ? `${IMAGE_BASE}${details.poster_path}` : movie.logo,
    backdrop_path: details.backdrop_path ? `${IMAGE_BASE}${details.backdrop_path}` : null,
    overview: details.overview || movie.plot,
    vote_average: details.vote_average,
    release_date: details.release_date,
    genres: details.genres?.map(g => g.name).join(', ') || movie.genre,
    runtime: details.runtime,
  };
  
  // Guardar en caché
  await db.tmdbCache.put({ tmdbId: movie.stream_id, type: 'movie', data: enriched });
  return enriched;
}

export async function enrichSeriesMetadata(series) {
  if (!series.name) return series;
  
  const cached = await db.tmdbCache.where({ tmdbId: series.series_id, type: 'series' }).first();
  if (cached) return { ...series, ...cached.data };
  
  const searchRes = await fetchFromTMDB('/search/tv', { query: series.name });
  if (!searchRes?.results?.length) return series;
  
  const tmdbSeries = searchRes.results[0];
  const details = await fetchFromTMDB(`/tv/${tmdbSeries.id}`);
  
  const enriched = {
    ...series,
    poster_path: details.poster_path ? `${IMAGE_BASE}${details.poster_path}` : series.poster,
    backdrop_path: details.backdrop_path ? `${IMAGE_BASE}${details.backdrop_path}` : null,
    overview: details.overview || series.plot,
    vote_average: details.vote_average,
    first_air_date: details.first_air_date,
    genres: details.genres?.map(g => g.name).join(', ') || series.genre,
    number_of_seasons: details.number_of_seasons,
  };
  
  await db.tmdbCache.put({ tmdbId: series.series_id, type: 'series', data: enriched });
  return enriched;
}
