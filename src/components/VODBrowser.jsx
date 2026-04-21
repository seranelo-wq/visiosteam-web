import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/channelDB';
import { enrichMovieMetadata, enrichSeriesMetadata } from '../services/tmdbService';
import MovieCard from './MovieCard';
import SeriesCard from './SeriesCard';
import SeriesDetail from './SeriesDetail';
import Player from './Player';

const VODBrowser = () => {
  const [activeTab, setActiveTab] = useState('movies');
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [playingItem, setPlayingItem] = useState(null);
  const [enrichedMovies, setEnrichedMovies] = useState([]);
  const [enrichedSeries, setEnrichedSeries] = useState([]);

  const rawMovies = useLiveQuery(() => db.movies.toArray(), []);
  const rawSeries = useLiveQuery(() => db.series.toArray(), []);

  // Enriquecer con TMDB en segundo plano
  useEffect(() => {
    if (rawMovies) {
      Promise.all(rawMovies.map(m => enrichMovieMetadata(m))).then(setEnrichedMovies);
    }
  }, [rawMovies]);

  useEffect(() => {
    if (rawSeries) {
      Promise.all(rawSeries.map(s => enrichSeriesMetadata(s))).then(setEnrichedSeries);
    }
  }, [rawSeries]);

  const handlePlayMovie = (movie) => {
    setPlayingItem({ url: movie.url, title: movie.name, type: 'movie' });
  };

  const handleSelectSeries = (series) => {
    setSelectedSeries(series);
  };

  const handlePlayEpisode = (episode) => {
    setPlayingItem({ url: episode.url, title: episode.title, type: 'episode' });
  };

  if (playingItem) {
    return <Player streamUrl={playingItem.url} title={playingItem.title} onClose={() => setPlayingItem(null)} />;
  }

  if (selectedSeries) {
    return (
      <SeriesDetail 
        series={selectedSeries} 
        onBack={() => setSelectedSeries(null)} 
        onPlayEpisode={handlePlayEpisode}
      />
    );
  }

  const displayMovies = enrichedMovies.length ? enrichedMovies : rawMovies || [];
  const displaySeries = enrichedSeries.length ? enrichedSeries : rawSeries || [];

  return (
    <div className="vod-browser">
      <div className="vod-tabs">
        <button className={activeTab==='movies'?'active':''} onClick={()=>setActiveTab('movies')}>Películas</button>
        <button className={activeTab==='series'?'active':''} onClick={()=>setActiveTab('series')}>Series</button>
      </div>

      {activeTab === 'movies' && (
        <div className="content-grid">
          {displayMovies.map(movie => (
            <MovieCard key={movie.id || movie.stream_id} movie={movie} onPlay={handlePlayMovie} />
          ))}
        </div>
      )}

      {activeTab === 'series' && (
        <div className="content-grid">
          {displaySeries.map(series => (
            <SeriesCard key={series.id || series.series_id} series={series} onSelect={handleSelectSeries} />
          ))}
        </div>
      )}
    </div>
  );
};

export default VODBrowser;
