import {stations,floor} from './motion.js?v=22';
// Run after every movement system: games, jobs and cooldowns cannot bypass water.
export const createWash=()=>new WeakMap();
export function advanceWash(history,pets,dt){
 const zone=stations.wash,width=zone.right-zone.left;
 for(const p of pets){
  const grounded=p.level===zone.level&&!p.stair&&(p.routeFloor==null||Math.abs(p.routeFloor-floor(zone.level))<.001);
  const before=history.get(p);history.set(p,{x:p.x,grounded});
  const inside=grounded&&p.x>=zone.left&&p.x<=zone.right;
  p.washActive=inside;
  if(!grounded||dt<=0)continue;
  const moved=before?.grounded?Math.abs(p.x-before.x):0;
  // Screen wrapping is not a physical trip across the shower.
  const continuous=before?.grounded&&moved<.5;
  const covered=continuous?Math.max(0,Math.min(zone.right,Math.max(before.x,p.x))-Math.max(zone.left,Math.min(before.x,p.x))):0;
  if(!inside&&!covered)continue;
  const exposure=moved>0&&continuous?covered/moved:inside?1:0;
  p.cleanliness=Math.min(1,p.cleanliness+covered/width+dt*exposure*.2);
 }
}
