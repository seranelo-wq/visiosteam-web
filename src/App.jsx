import React, { useState } from 'react';
import ImportPanel from './components/ImportPanel';
import VirtualChannelList from './components/VirtualChannelList';
import VODBrowser from './components/VODBrowser';
import EPGGuide from './components/EPGGuide';
import Player from './components/Player';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('live'); // 'live', 'vod', 'epg'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleImportSuccess = () => setRefreshKey(prev => prev + 1);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>VisioStream</h1>
        <nav className="main-nav">
          <button className={activeView==='live'?'active':''} onClick={()=>setActiveView('live')}>TV en Vivo</button>
          <button className={activeView==='vod'?'active':''} onClick={()=>setActiveView('vod')}>Películas/Series</button>
          <button className={activeView==='epg'?'active':''} onClick={()=>setActiveView('epg')}>Guía EPG</button>
        </nav>
        <ImportPanel onSuccess={handleImportSuccess} />
      </header>

      <main className="content-area">
        {activeView === 'live' && (
          <>
            <input
              type="text"
              placeholder="Buscar canales..."
              className="search-bar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <VirtualChannelList 
              key={refreshKey}
              searchTerm={searchTerm} 
              onChannelSelect={setSelectedChannel} 
            />
          </>
        )}
        {activeView === 'vod' && <VODBrowser />}
        {activeView === 'epg' && <EPGGuide onChannelSelect={setSelectedChannel} />}
      </main>

      {selectedChannel && (
        <Player 
          streamUrl={selectedChannel.url} 
          title={selectedChannel.name}
          onClose={() => setSelectedChannel(null)} 
        />
      )}
    </div>
  );
}

export default App;
