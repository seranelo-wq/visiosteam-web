import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/channelDB';

const ChannelList = () => {
  const channels = useLiveQuery(() => db.channels.limit(200).toArray(), []);

  if (!channels) return <p>Cargando...</p>;

  return (
    <div>
      {channels.map(ch => (
        <div key={ch.id} style={{
          padding:10,
          borderBottom:'1px solid #333'
        }}>
          {ch.name}
        </div>
      ))}
    </div>
  );
};

export default ChannelList;
