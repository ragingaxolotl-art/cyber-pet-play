import {makePet,hasAction} from './motion.js?v=care46';
// Keep object identity, place and session relationships when an uploaded backup changes.
export function reconcilePets(data,current){
 const byId=new Map(current.map(p=>[p.data.boardId||p.data.id,p]));
 return data.map((pet,i)=>{
  const p=byId.get(pet.boardId||pet.id);if(!p)return makePet(pet,i,data.length);
  if(p.data!==pet){p.data=pet;p.renderAction=null;p.renderClock=0;
   if(!hasAction(pet,'walking')&&!['idle','social','gesture','snack','eat','quarantine','medicine','clinicWalk'].includes(p.mode)){p.mode='idle';p.timer=2;p.stair=null;p.routeFloor=null;p.gameMoving=false;p.counterMoving=false;p.foodTrip=null;p.washTrip=null;}
  }
  return p;
 });
}
