import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/channelDB';
import { format, addHours, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';

const EPGGuide = ({ onChannelSelect }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const channels = useLiveQuery(() => db.channels.limit(100).toArray());
  
  const epgData = useLiveQuery(async () => {
    if (!channels) return [];
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0,0,0,0);
    const endOfDay = addHours(startOfDay, 24);
    
    const programs = await db.epg
      .where('start')
      .between(startOfDay.toISOString(), endOfDay.toISOString())
      .toArray();
      
    const map = {};
    channels.forEach(ch => { map[ch.id] = []; });
    programs.forEach(p => {
      if (map[p.channelId]) map[p.channelId].push(p);
    });
    return map;
  }, [channels, selectedDate]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const handleNow = () => setSelectedDate(new Date());

  return (
    <div className="epg-guide">
      <div className="epg-controls">
        <button onClick={() => setSelectedDate(d => addHours(d, -24))}>◀ Día anterior</button>
        <span>{format(selectedDate, 'EEEE d MMM yyyy', { locale: es })}</span>
        <button onClick={() => setSelectedDate(d => addHours(d, 24))}>Día siguiente ▶</button>
        <button onClick={handleNow}>Hoy</button>
      </div>
      
      <div className="epg-grid">
        <div className="epg-header">
          <div className="channel-col">Canales</div>
          <div className="timeline-col">
            {hours.map(h => (
              <div key={h} className="hour-cell">{h}:00</div>
            ))}
          </div>
        </div>
        
        <div className="epg-body">
          {channels?.map(channel => (
            <div key={channel.id} className="channel-row">
              <div className="channel-logo-name" onClick={() => onChannelSelect(channel)}>
                <img src={channel.logo || 'https://via.placeholder.com/40'} alt="" />
                <span>{channel.name}</span>
              </div>
              <div className="programs-row">
                {hours.map(h => {
                  const slotStart = new Date(selectedDate);
                  slotStart.setHours(h, 0, 0, 0);
                  const slotEnd = addHours(slotStart, 1);
                  
                  const program = epgData?.[channel.id]?.find(p => 
                    isWithinInterval(new Date(p.start), { start: slotStart, end: slotEnd }) ||
                    isWithinInterval(slotStart, { start: new Date(p.start), end: new Date(p.stop) })
                  );
                  
                  return (
                    <div key={h} className="program-slot" title={program?.title}>
                      {program ? (
                        <div className="program-item" style={{
                          background: '#3b82f6',
                          width: '100%',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          padding: '2px 4px',
                          borderRadius: 4,
                          fontSize: '0.8rem'
                        }}>
                          {program.title}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EPGGuide;
