import {freeForActivity} from './activity-state.js?v=27';
import {hasAction,stairs,floor,addWalkingDirt} from './motion.js?v=27';
import {travelSpeed,trait} from './profile.js?v=27';
// Session appetites create purposeful visits; saved fullness is never changed.
export function startFoodTrip(p){
 if(!p.data.food||!hasAction(p.data,'eat')||!hasAction(p.data,'walking')||p.stair||p.socialGroup||p.playGroup)return false;
 const points=[{x:p.x,level:p.level}];
 if(p.level===0){const s=stairs[0];points.push({x:s.a,level:0},{x:s.b,level:1});}
 if(p.level===2){const s=stairs[1];points.push({x:s.b,level:2},{x:s.a,level:1});}
 p.foodTrip={points,segment:0,progress:0};p.mode='seekFood';p.clock=0;p.emote='drooling';p.emoteTime=4;return true;
}
export function advanceMeals(pets,dt){
 for(const [index,p] of pets.entries()){
  p.mealDue=Math.max(0,(p.mealDue??(8+index*7))-dt);
  if(['eat','snack','counterQueue','counterLeave'].includes(p.mode)){p.mealDue=100+60*(1-trait(p,'activity_level'));continue;}
  if(p.mode==='seekFood'){
   if(!hasAction(p.data,'walking')||!p.data.food||!p.foodTrip){p.mode='idle';p.timer=2;p.foodTrip=null;p.routeFloor=null;continue;}
   const trip=p.foodTrip,from=trip.points[trip.segment],to=trip.points[trip.segment+1];
   if(to){const length=Math.hypot(to.x-from.x,(to.level-from.level)*.255),step=Math.min(length*(1-trip.progress),travelSpeed(p)*dt);trip.progress=length?Math.min(1,trip.progress+step/length):1;p.direction=Math.sign(to.x-from.x)||1;p.x=from.x+(to.x-from.x)*trip.progress;p.routeFloor=floor(from.level)+(floor(to.level)-floor(from.level))*trip.progress;addWalkingDirt(p,step);if(trip.progress===1){p.level=to.level;trip.segment++;trip.progress=0;p.routeFloor=null;}}
   else {const target=p.counterEntry??.49;if(target<.04){p.mode='walk';p.timer=5;p.mealDue=20;p.foodTrip=null;continue;}const delta=target-p.x,step=Math.min(Math.abs(delta),travelSpeed(p)*dt);p.direction=Math.sign(delta)||1;p.x+=p.direction*step;addWalkingDirt(p,step);if(Math.abs(p.x-target)<.01&&p.joinCounter?.()){p.foodTrip=null;p.routeFloor=null;}}
   continue;
  }
  if(p.mealDue===0&&freeForActivity(p)){if(!startFoodTrip(p))p.mealDue=40;}
 }
}
