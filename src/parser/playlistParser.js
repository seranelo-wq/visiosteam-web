import { db } from '../db/channelDB';
import convert from 'xml-js';

// ==================== UTILIDADES ====================
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

// ==================== IMPORTACIÓN M3U (Canales + VOD) ====================
export async function parseM3UFromUrl(url, onProgress) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Error al descargar M3U');
  const text = await response.text();
  const lines = text.split('\n');
  
  await db.channels.clear();
  await db.movies.clear();
  await db.series.clear();
  await db.episodes.clear();
  
  let batch = [];
  let currentItem = null;
  const BATCH_SIZE = 500;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('#EXTINF:')) {
      const nameMatch = line.match(/tvg-name="([^"]*)"/);
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupMatch = line.match(/group-title="([^"]*)"/);
      const title = line.split(',').pop() || 'Sin nombre';
      
      // Detección de tipo VOD (si group-title contiene "Movie" o "Series")
      const group = groupMatch ? groupMatch[1] : 'General';
      const isVOD = /pel[ií]cula|movie|film|cinema/i.test(group);
      const isSeries = /serie|tv show|episodio/i.test(group);
      
      currentItem = {
        name: nameMatch ? nameMatch[1] : title,
        logo: logoMatch ? logoMatch[1] : null,
        group: group,
        type: isVOD ? 'movie' : (isSeries ? 'series' : 'live'),
        url: ''
      };
    } else if (line && !line.startsWith('#') && currentItem) {
      currentItem.url = line;
      
      if (currentItem.type === 'live') {
        batch.push({
          name: currentItem.name,
          url: currentItem.url,
          logo: currentItem.logo,
          group: currentItem.group
        });
      } else if (currentItem.type === 'movie') {
        batch.push({
          stream_id: `m3u_${Date.now()}_${Math.random()}`,
          name: currentItem.name,
          url: currentItem.url,
          logo: currentItem.logo,
          category: currentItem.group
        });
      } else if (currentItem.type === 'series') {
        // Para series desde M3U (simplificado)
        batch.push({
          series_id: `m3u_series_${Date.now()}`,
          name: currentItem.name,
          poster: currentItem.logo,
          category: currentItem.group,
          url: currentItem.url  // Guardamos la URL base del stream
        });
      }
      
      currentItem = null;
      
      if (batch.length >= BATCH_SIZE) {
        if (currentItem?.type === 'live') await db.channels.bulkAdd(batch);
        else if (currentItem?.type === 'movie') await db.movies.bulkAdd(batch);
        else if (currentItem?.type === 'series') await db.series.bulkAdd(batch);
        batch = [];
        await new Promise(r => setTimeout(r, 5));
        if (onProgress) onProgress((i / lines.length) * 100);
      }
    }
  }
  // Insertar remanente
  if (batch.length > 0) {
    // Determinar tipo según el último elemento (simplificado)
    if (batch[0].hasOwnProperty('group')) await db.channels.bulkAdd(batch);
    else if (batch[0].hasOwnProperty('stream_id')) await db.movies.bulkAdd(batch);
    else await db.series.bulkAdd(batch);
  }
  return true;
}

// ==================== IMPORTACIÓN XTREAM CODES (Completo) ====================
export async function parseXtreamCodes(server, username, password, onProgress) {
  const base = server.replace(/\/$/, '');
  const apiUrl = `${base}/player_api.php?username=${username}&password=${password}`;
  
  // Limpiar bases
  await db.channels.clear();
  await db.movies.clear();
  await db.series.clear();
  await db.episodes.clear();
  await db.epg.clear();
  
  // 1. CANALES EN VIVO
  const liveCatRes = await fetch(`${apiUrl}&action=get_live_categories`);
  const liveCats = await liveCatRes.json();
  let processed = 0;
  const totalSteps = liveCats.length + 3; // + movies, series, epg
  
  for (const cat of liveCats) {
    const streamsRes = await fetch(`${apiUrl}&action=get_live_streams&category_id=${cat.category_id}`);
    const streams = await streamsRes.json();
    const batch = streams.map(s => ({
      name: s.name,
      url: `${base}/live/${username}/${password}/${s.stream_id}.m3u8`,
      logo: s.stream_icon || null,
      group: cat.category_name
    }));
    await db.channels.bulkAdd(batch);
    processed++;
    if (onProgress) onProgress((processed / totalSteps) * 100);
  }
  
  // 2. PELÍCULAS (VOD)
  const vodCatsRes = await fetch(`${apiUrl}&action=get_vod_categories`);
  const vodCats = await vodCatsRes.json();
  for (const cat of vodCats) {
    const streamsRes = await fetch(`${apiUrl}&action=get_vod_streams&category_id=${cat.category_id}`);
    const streams = await streamsRes.json();
    const batch = streams.map(s => ({
      stream_id: s.stream_id,
      name: s.name,
      url: `${base}/movie/${username}/${password}/${s.stream_id}.${s.container_extension}`,
      logo: s.stream_icon || null,
      category: cat.category_name,
      plot: s.plot || '',
      cast: s.cast || '',
      director: s.director || '',
      genre: s.genre || '',
      rating: s.rating || '',
      year: s.year || ''
    }));
    await db.movies.bulkAdd(batch);
    processed++;
    if (onProgress) onProgress((processed / totalSteps) * 100);
  }
  
  // 3. SERIES
  const seriesCatsRes = await fetch(`${apiUrl}&action=get_series_categories`);
  const seriesCats = await seriesCatsRes.json();
  for (const cat of seriesCats) {
    const seriesRes = await fetch(`${apiUrl}&action=get_series&category_id=${cat.category_id}`);
    const seriesList = await seriesRes.json();
    for (const s of seriesList) {
      // Guardar serie
      await db.series.put({
        series_id: s.series_id,
        name: s.name,
        poster: s.cover || null,
        category: cat.category_name,
        plot: s.plot || '',
        cast: s.cast || '',
        genre: s.genre || '',
        rating: s.rating || '',
        year: s.year || ''
      });
      // Obtener episodios
      const epsRes = await fetch(`${apiUrl}&action=get_series_info&series_id=${s.series_id}`);
      const epsData = await epsRes.json();
      if (epsData.episodes) {
        const episodes = [];
        for (const season in epsData.episodes) {
          for (const ep of epsData.episodes[season]) {
            episodes.push({
              series_id: s.series_id,
              season_num: parseInt(season),
              episode_num: ep.episode_num,
              title: ep.title,
              url: `${base}/series/${username}/${password}/${ep.id}.${ep.container_extension}`,
              plot: ep.plot || '',
              duration: ep.duration || '',
              poster: ep.info?.movie_image || null
            });
          }
        }
        await db.episodes.bulkAdd(episodes);
      }
    }
    processed++;
    if (onProgress) onProgress((processed / totalSteps) * 100);
  }
  
  // 4. EPG (XMLTV)
  const epgUrl = `${apiUrl}&action=get_epg`;
  try {
    const xmlText = await fetchWithRetry(epgUrl);
    const json = convert.xml2json(xmlText, { compact: true, spaces: 2 });
    const data = JSON.parse(json);
    const programmes = data?.tv?.programme || [];
    const epgBatch = [];
    for (const prog of programmes) {
      const channelId = prog._attributes.channel;
      const start = prog._attributes.start;
      const stop = prog._attributes.stop;
      const title = prog.title?._text || '';
      const desc = prog.desc?._text || '';
      
      epgBatch.push({
        channelId,
        start: new Date(start).toISOString(),
        stop: new Date(stop).toISOString(),
        title,
        desc
      });
      
      if (epgBatch.length >= 500) {
        await db.epg.bulkAdd(epgBatch);
        epgBatch.length = 0;
      }
    }
    if (epgBatch.length) await db.epg.bulkAdd(epgBatch);
    processed++;
    if (onProgress) onProgress((processed / totalSteps) * 100);
  } catch (e) {
    console.warn('EPG no disponible o error:', e);
  }
  
  return true;
}
