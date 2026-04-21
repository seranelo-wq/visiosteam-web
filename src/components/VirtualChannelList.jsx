import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/channelDB';

const ChannelRow = ({ index, style, data }) => {
  const { channels, onSelect } = data;
  const channel = channels[index];
  
  return (
    <div style={style} className="channel-row" onClick={() => onSelect(channel)}>
      <img 
        src={channel.logo || 'https://via.placeholder.com/48?text=TV'} 
        className="channel-logo"
        loading="lazy"
        onError={(e) => e.target.src = 'https://via.placeholder.com/48?text=TV'}
        alt=""
      />
      <div className="channel-info">
        <div className="channel-name">{channel.name}</div>
        <div className="channel-group">{channel.group}</div>
      </div>
    </div>
  );
};

const VirtualChannelList = ({ searchTerm, onChannelSelect }) => {
  const channels = useLiveQuery(
    async () => {
      if (!searchTerm) return await db.channels.toArray();
      const all = await db.channels.toArray();
      const term = searchTerm.toLowerCase();
      return all.filter(c => 
        c.name.toLowerCase().includes(term) || 
        c.group.toLowerCase().includes(term)
      );
    },
    [searchTerm]
  );

  const itemData = useMemo(() => ({
    channels: channels || [],
    onSelect: onChannelSelect
  }), [channels, onChannelSelect]);

  if (!channels) return <div style={{padding: 20}}>Cargando canales...</div>;
  if (channels.length === 0) {
    return <div style={{padding: 20, color: '#aaa'}}>
      {searchTerm ? 'No se encontraron canales' : 'No hay canales. Importa una lista.'}
    </div>;
  }

  return (
    <List
      height={window.innerHeight - 140}
      itemCount={channels.length}
      itemSize={80}
      width="100%"
      itemData={itemData}
    >
      {ChannelRow}
    </List>
  );
};

export default VirtualChannelList;
