import {freeForActivity} from './activity-state.js?v=28';
import {washThreshold,love,travelSpeed,traitFeeling} from './profile.js?v=28';
import {stairs,stations,floor,hasAction,addWalkingDirt} from './motion.js?v=28';
export function startWashTrip(p){
 if(!hasAction(p.data,'walking')||p.stair||p.socialGroup||p.playGroup)return false;
 const points=[{x:p.x,level:p.level}];
 for(let level=p.level;level<2;level++){const stair=stairs.find(s=>s.from===level);points.push({x:stair.a,level},{x:stair.b,level:level+1});}
 const zone=stations.wash,last=points[points.length-1],direction=last.x>zone.right?-1:1;
 points.push({x:direction===1?zone.left:zone.right,level:2});
 p.washTrip={points,segment:0,progress:0,direction};p.mode='seekWash';p.clock=0;p.gameMoving=true;p.socialCooldown=30;p.emote=love(p)<.3?'frustrated':'sweat';p.emoteTime=4;return true;
}
export function advanceHygiene(pets,dt){
 for(const p of pets){
  p.hygieneCooldown=Math.max(0,(p.hygieneCooldown??8)-dt);
  if(p.mode==='seekWash'){
   if(!hasAction(p.data,'walking')||!p.washTrip){p.mode='idle';p.timer=2;p.washTrip=null;p.routeFloor=null;p.gameMoving=false;continue;}
   const route=p.washTrip,from=route.points[route.segment],to=route.points[route.segment+1];
   const length=Math.hypot(to.x-from.x,(to.level-from.level)*.255),step=Math.min(length*(1-route.progress),travelSpeed(p)*dt);
   route.progress=length?Math.min(1,route.progress+step/length):1;
   p.direction=Math.sign(to.x-from.x)||route.direction;p.x=from.x+(to.x-from.x)*route.progress;p.routeFloor=floor(from.level)+(floor(to.level)-floor(from.level))*route.progress;
   addWalkingDirt(p,step);p.gameMoving=step>0;
   if(route.progress===1){p.level=to.level;route.segment++;route.progress=0;
    if(route.segment===route.points.length-1){p.washTrip=null;p.routeFloor=null;p.gameMoving=false;p.mode='wash';p.direction=route.direction;p.washProgress=0;p.washStartCleanliness=p.cleanliness;p.clock=0;p.hygieneCooldown=60;p.emote='ok';p.emoteTime=3;}
   }
   continue;
  }
  if(p.hygieneCooldown>0||!freeForActivity(p))continue;
  p.hygieneCooldown=10+p.random()*10;
  if(p.cleanliness<washThreshold(p)&&p.random()<.35+.45*love(p))startWashTrip(p);
 }
}
