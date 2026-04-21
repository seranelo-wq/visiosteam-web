import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/channelDB';

const SeriesDetail = ({ series, onBack, onPlayEpisode }) => {
  const episodes = useLiveQuery(
    () => db.episodes.where('series_id').equals(series.series_id).toArray(),
    [series.series_id]
  );

  const seasons = episodes?.reduce((acc, ep) => {
    if (!acc[ep.season_num]) acc[ep.season_num] = [];
    acc[ep.season_num].push(ep);
    return acc;
  }, {});

  const poster = series.poster_path || series.poster || 'https://via.placeholder.com/200x300?text=No+Image';

  return (
    <div className="series-detail">
      <button onClick={onBack} style={{background:'#2a2a2a', border:'none', color:'white', padding:'8px 20px', borderRadius:'20px', cursor:'pointer'}}>← Volver</button>
      <div className="series-header">
        <img src={poster} alt={series.name} />
        <div>
          <h2>{series.name}</h2>
          <p>{series.overview || series.plot}</p>
          <p>Género: {series.genres || series.genre}</p>
          <p>Reparto: {series.cast}</p>
        </div>
      </div>
      <h3>Episodios</h3>
      {seasons && Object.keys(seasons).sort((a,b) => a-b).map(seasonNum => (
        <div key={seasonNum} className="season">
          <h4>Temporada {seasonNum}</h4>
          <div className="episode-list">
            {seasons[seasonNum].sort((a,b) => a.episode_num - b.episode_num).map(ep => (
              <div key={ep.id} className="episode-item" onClick={() => onPlayEpisode(ep)}>
                <span>{ep.episode_num}. {ep.title}</span>
                <span>{ep.duration}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SeriesDetail;
