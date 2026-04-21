import React from 'react';

const MovieCard = ({ movie, onPlay }) => {
  const poster = movie.poster_path || movie.logo || 'https://via.placeholder.com/200x300?text=No+Image';
  return (
    <div className="card">
      <img src={poster} alt={movie.name} />
      <div className="card-info">
        <h4>{movie.name}</h4>
        <p>{movie.year || movie.release_date?.substring(0,4)}</p>
        <button onClick={() => onPlay(movie)}>▶ Reproducir</button>
      </div>
    </div>
  );
};

export default MovieCard;
