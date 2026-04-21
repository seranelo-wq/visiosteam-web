import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { getProxiedUrl } from '../utils/proxyHelper';

const Player = ({ streamUrl, title, onClose }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const proxiedUrl = getProxiedUrl(streamUrl);
    
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(proxiedUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.warn('Autoplay bloqueado:', e));
      });
      return () => hls.destroy();
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = proxiedUrl;
      video.addEventListener('loadedmetadata', () => video.play());
    }
  }, [streamUrl]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => document.body.style.overflow = 'auto';
  }, []);

  return (
    <div className="player-container">
      <div className="player-header">
        <span>{title}</span>
        <button className="close-btn" onClick={onClose}>✕ Cerrar</button>
      </div>
      <div className="video-wrapper">
        <video ref={videoRef} controls autoPlay playsInline />
      </div>
    </div>
  );
};

export default Player;
