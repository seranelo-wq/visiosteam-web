import React from 'react';

const SeriesCard = ({ series, onSelect }) => {
  const poster = series.poster_path || series.poster || 'https://via.placeholder.com/200x300?text=No+Image';
  return (
    <div className="card" onClick={() => onSelect(series)}>
      <img src={poster} alt={series.name} />
      <div className="card-info">
        <h4>{series.name}</h4>
        <p>{series.year || series.first_air_date?.substring(0,4)}</p>
      </div>
    </div>
  );
};

export default SeriesCard;
