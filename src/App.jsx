import React, { useEffect } from 'react';
import { db } from './db/channelDB';
import ChannelList from './components/ChannelList';

function App() {

  useEffect(() => {
    db.channels.clear();

    for (let i = 1; i <= 100; i++) {
      db.channels.add({
        name: 'Canal ' + i,
        group: 'General'
      });
    }
  }, []);

  return (
    <div style={{padding:20}}>
      <h1>VisioStream 🚀</h1>
      <ChannelList />
    </div>
  );
}

export default App;
