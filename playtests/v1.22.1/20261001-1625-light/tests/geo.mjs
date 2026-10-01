const w = await import('/home/user/kingvi/js/world.js');
const d=w.WOLF_DEN, a=w.WATCHER_AT;
console.log('den',d,'watcher',a,'dist',Math.hypot(a.x-d.x,(a.y-d.y)*1.3).toFixed(1), 'reach normal', d.r*0.8, 'scent', d.r+140, 'house door', w.HOUSE_DOOR_OUT);
