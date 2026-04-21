import Dexie from 'dexie';

export const db = new Dexie('visiosteamDB');

db.version(1).stores({
  channels: '++id, name, group'
});
