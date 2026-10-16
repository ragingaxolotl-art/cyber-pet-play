import {travelSpeed,trait,love} from './profile.js?v=30';
import {foodScore} from './food.js?v=30';
import {collectItem} from './sharing.js?v=30';
import {hasAction,animationDuration} from './motion.js?v=30';
const FRONT=.49,LEFT=.045,RIGHT=.97,GAP=.014;
export const queueWidth=p=>Math.max(.018,p.bodyWidth||.055);
export const queueGap=(a,b)=>(queueWidth(a)+queueWidth(b))/2+GAP;
export function foodReaction(p){
 const score=foodScore({...p.data.food,tags:p.data.food?.tags||[]},p.data.foodPreferences||{});
 const l=love(p),s=trait(p,'sociability'),g=trait(p,'generosity'),a=trait(p,'activity_level'),c=trait(p,'curiosity'),b=trait(p,'bravery'),v=trait(p,'assertiveness');
 if(score<=0)return l>=.5?(v>.5?'thinking':'sweat'):(v>.5?'frustrated':'crying');
 if(l<.35){if(v>.65)return 'frustrated';if(s<.35)return 'silence';if(b<.35)return 'sweat';return a>.6?'eager':'thinking';}
 if(g>.65)return 'hearts';if(s<.35)return 'cute';if(a>.65)return 'laughing';if(c>.7)return 'question';if(b<.3)return 'cute';return s>.65?'love':'ok';
}
const active=p=>['counterQueue','counterLeave','eat'].includes(p.mode)&&p.level===1&&!p.stair;
export function prepareCounterQueue(c,pets){
 c.managed=true;c.queue=(c.queue||[]).filter(p=>pets.includes(p)&&p.mode==='counterQueue'&&p.level===1&&!p.stair);
 c.diners=(c.diners||[]).filter(p=>pets.includes(p)&&active(p));
 if(c.customer&&(!pets.includes(c.customer)||!active(c.customer))){c.customer=null;c.clock=0;}
 for(const p of pets){
  p.counterService=true;
  const tail=c.queue.at(-1),entry=tail?Math.min(tail.x,FRONT)-queueGap(tail,p):FRONT;
  p.counterEntry=entry;
  p.joinCounter=()=>{
   // Full or oversized crowds keep walking and may try on their next lap.
   const last=c.queue.at(-1),x=last?Math.min(last.x,FRONT)-queueGap(last,p):FRONT;
   if(Math.abs(p.x-x)>.012||x-queueWidth(p)/2<LEFT||queueWidth(p)>.3||c.queue.includes(p))return false;
   p.x=x;p.mode='counterQueue';p.clock=0;p.awaitingCounter=true;p.counterWait=0;p.counterMoving=false;p.direction=1;c.queue.push(p);return true;
  };
 }
}
function seat(c,p){
 let x=.58+queueWidth(p)/2;
 for(const other of [...c.diners].sort((a,b)=>(a.counterSeat??a.x)-(b.counterSeat??b.x))){const place=other.counterSeat??other.x;if(Math.abs(place-x)<queueGap(p,other))x=place+queueGap(p,other);}
 return x+queueWidth(p)/2<RIGHT?x:null;
}
function move(p,target,dt,blocker){
 const before=p.x;
 if(blocker)target=Math.min(target,blocker.x-queueGap(p,blocker));
 // Never move backward to resolve a queue; admission reserves an unoccupied place.
 p.x=Math.max(p.x,Math.min(target,p.x+travelSpeed(p)*dt));
 p.direction=1;p.counterMoving=p.x>before+1e-8;
}
export function advanceCounterQueue(c,pets,dt,ready,timing){
 prepareCounterQueue(c,pets);c.idleClock+=dt;
 // Served pets leave toward reserved dining places before the next pet steps up.
 for(const p of c.diners.filter(p=>p.mode==='counterLeave').sort((a,b)=>b.x-a.x)){
  if(p.counterReceiveTime>0){p.counterReceiveTime=Math.max(0,p.counterReceiveTime-dt);p.counterMoving=false;continue;}
  const ahead=c.diners.filter(q=>q!==p&&q.x>p.x).sort((a,b)=>a.x-b.x)[0];move(p,p.counterSeat,dt,ahead);
  if(Math.abs(p.x-p.counterSeat)<.00001){
   p.counterMoving=false;p.clock=0;p.awaitingCounter=false;
   if(hasAction(p.data,'eat')){p.mode='eat';p.timer=p.mealDuration=Math.max(6,animationDuration(p.data.config,'eat')*2);}
   else {collectItem(p);p.mode='walk';p.timer=20;p.stationCooldown=55;}
  }
 }
 let ahead=c.diners.filter(p=>p.mode==='counterLeave'&&p.x>=FRONT).sort((a,b)=>a.x-b.x)[0];
 for(const p of c.queue){p.counterWait+=dt;move(p,ahead?Math.min(FRONT,ahead.x-queueGap(p,ahead)):FRONT,dt,ahead);ahead=p;}
 if(c.customer){
  c.clock+=dt;
  if(c.customer.awaitingCounter&&(!ready||c.clock>=timing.handoffAt)){
   const p=c.customer;p.awaitingCounter=false;p.clock=0;p.mode='counterLeave';p.emote=foodReaction(p);p.emoteTime=5;p.foodReactionTime=5;p.counterReceiveTime=.8;p.counterMoving=false;
   c.queue=c.queue.filter(q=>q!==p);c.diners.push(p);
  }
  if(!ready||c.clock>=timing.serviceDuration){c.customer=null;c.clock=0;c.idleClock=0;}
 }
 const head=c.queue[0];
 if(!c.customer&&head&&c.hostReady!==false&&Math.abs(head.x-FRONT)<.00001){
  const destination=seat(c,head);
  if(destination!==null){head.counterSeat=destination;c.customer=head;c.clock=0;c.servingHost=c.preferredHost??((c.servingHost||0)^1);}
 }
}
