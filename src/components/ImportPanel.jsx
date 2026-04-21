import React, { useState } from 'react';
import { parseM3UFromUrl, parseXtreamCodes } from '../parser/playlistParser';
import './ImportPanel.css';

const ImportPanel = ({ onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('url');
  const [url, setUrl] = useState('');
  const [xtreamServer, setXtreamServer] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleImport = async () => {
    setLoading(true);
    setProgress(0);
    try {
      if (mode === 'url') {
        await parseM3UFromUrl(url, (p) => setProgress(p));
      } else {
        await parseXtreamCodes(xtreamServer, username, password, (p) => setProgress(p));
      }
      onSuccess();
      setIsOpen(false);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="import-panel">
      <button className="import-toggle" onClick={() => setIsOpen(!isOpen)}>
        ⚙️ Importar Lista
      </button>
      
      {isOpen && (
        <div className="import-modal">
          <h3>Importar Canales y VOD</h3>
          <div className="mode-selector">
            <button className={mode==='url'?'active':''} onClick={()=>setMode('url')}>URL M3U</button>
            <button className={mode==='xtream'?'active':''} onClick={()=>setMode('xtream')}>Xtream Codes</button>
          </div>

          {mode === 'url' ? (
            <input
              type="text"
              placeholder="http://.../playlist.m3u"
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
          ) : (
            <>
              <input placeholder="Servidor (ej: http://iptv.com)" value={xtreamServer} onChange={e=>setXtreamServer(e.target.value)} />
              <input placeholder="Usuario" value={username} onChange={e=>setUsername(e.target.value)} />
              <input placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
            </>
          )}

          {loading && <progress value={progress} max="100" />}
          
          <div className="modal-actions">
            <button onClick={()=>setIsOpen(false)} disabled={loading}>Cancelar</button>
            <button onClick={handleImport} disabled={loading}>Importar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportPanel;
