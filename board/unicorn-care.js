import {freeForActivity} from './activity-state.js?v=friendship1';
import {floor,hasAction} from './motion.js?v=friendship1';
import {travelSpeed} from './profile.js?v=friendship1';
import {contagious,grantUnicornPotion} from './health.js?v=friendship1';
// Outbreak visits are separate from ordinary toy visits. All supplies are session-only gifts.
export const unicornCareSettings={deliveryChance:.2,arrivalBase:.30,extraInfected:.05,arrivalGrowth:0.05,rollSeconds:60,quietReset:30,visitLimit:180,handoffSeconds:2.4};
const ill=p=>!!p.health?.conditions.length;
const available=p=>!p.stair&&!p.socialGroup&&!p.playGroup&&!p.toyPlay&&(freeForActivity(p)||['quarantine','medicine'].includes(p.mode));
function flyTo(f,x,y,duration=3.6){f.state='fly';f.fromX=f.x;f.fromY=f.y;f.targetX=x;f.targetY=y;f.direction=Math.sign(x-f.x)||1;f.clock=0;f.duration=duration;}
function release(p){if(!p)return;p.unicornCare=false;if(p.mode==='clinicWalk'){p.mode='idle';p.timer=2;p.clock=0;}if(p.health)p.health.isolated=false;}
function leave(f){
 release(f.careVisit?.target);f.careVisit=null;f.careTent=null;f.greeting=null;f.feelingTime=0;f.state='leave';f.clock=0;f.duration=4;f.fromX=f.x;f.fromY=f.y;f.targetX=f.direction>0?1.08:-.08;f.targetY=.12;f.visitRemaining=0;
}
// One chance at outbreak onset, then once per active board minute. Never roll per frame.
export function unicornArrivalChance(count,infectedSeconds=0){
 if(count<=0)return 0;
 return Math.min(1,unicornCareSettings.arrivalBase+(count-1)*unicornCareSettings.extraInfected+infectedSeconds/60*unicornCareSettings.arrivalGrowth);
}
export function observeOutbreak(f,pets,dt){
 const o=f.careOutbreak??={number:0,active:false,quiet:0,ids:new Set(),handled:false};
 const infected=pets.filter(p=>p.health?.conditions.some(c=>contagious.has(c.id)));
 o.infectedCount=infected.length;
 if(!infected.length){
  o.quiet+=dt;
  if(o.quiet>=unicornCareSettings.quietReset){o.active=false;o.handled=false;o.requested=false;o.ids.clear();o.infectedSeconds=0;o.elapsed=0;o.nextRoll=0;o.rolls=0;}
  return o;
 }
 if(!o.active){o.active=true;o.number++;o.quiet=0;o.handled=false;o.requested=false;o.ids.clear();o.infectedSeconds=0;o.elapsed=0;o.nextRoll=0;o.rolls=0;}
 o.quiet=0;
 for(const p of infected)for(const c of p.health.conditions)if(contagious.has(c.id))o.ids.add(c.id);
 if(o.handled||o.requested)return o;
 // Older in-memory outbreaks and test fixtures can lack the new counters.
 o.elapsed??=0;o.infectedSeconds??=0;o.nextRoll??=0;o.rolls??=0;
 function roll(){o.chance=unicornArrivalChance(infected.length,o.infectedSeconds);o.rolls++;o.requested=f.random()<o.chance;o.nextRoll+=unicornCareSettings.rollSeconds;}
 if(o.nextRoll===0)roll();
 // Accumulate infected-character seconds so changing class sizes do not retroactively
 // multiply earlier minutes. Paused/hidden board time never reaches this function.
 let remaining=dt;
 while(remaining>0&&!o.requested){
  const step=Math.min(remaining,Math.max(0,o.nextRoll-o.elapsed));
  o.elapsed+=step;o.infectedSeconds+=step*infected.length;remaining-=step;
  if(o.elapsed+1e-8>=o.nextRoll)roll();else break;
 }
 return o;
}
export function startUnicornCare(f,pets,kind='delivery'){
 const o=f.careOutbreak;if(!o?.active||!pets.some(ill))return false;
 const site=[.45,.53,.37].find(x=>pets.every(p=>p.level!==0||p.stair||Math.abs(p.x-x)>.07));
 if(kind==='tent'&&site===undefined)kind='delivery';
 f.careVisit={kind,age:0,limit:Math.max(unicornCareSettings.visitLimit,pets.length*25),phase:'choose',target:null,served:new Set(),visits:0};
 f.careTent=kind==='tent'?{x:site,level:0,ready:false}:null;
 o.handled=true;f.magicTarget=null;f.magicAttempted=true;f.greeting=null;f.feeling='hearts';f.feelingTime=5;
 if(f.state==='absent'){f.x=-.08;f.y=.17;f.visits++;}
 f.visitRemaining=unicornCareSettings.visitLimit;
 if(f.careTent){f.careVisit.phase='setup';flyTo(f,site,floor(0),4.8);}
 else {f.state='talk';f.clock=0;f.duration=2.4;}
 return true;
}
function choosePatient(f,pets){
 const visit=f.careVisit;
 const options=pets.filter(p=>ill(p)&&available(p)&&!visit.served.has(p));
 options.sort((a,b)=>Math.max(...b.health.conditions.map(c=>c.severity))-Math.max(...a.health.conditions.map(c=>c.severity))||Math.abs(a.x-f.x)-Math.abs(b.x-f.x));
 const p=options[0];if(!p)return false;
 visit.target=p;visit.wait=0;p.unicornCare=true;p.health.isolated=true;
 if(f.careTent?.ready&&p.level===0&&hasAction(p.data,'walking')){
  visit.phase='clinic';p.mode='clinicWalk';p.clock=0;p.clinicTarget=f.careTent.x+.065;p.emote='ok';p.emoteTime=5;
  flyTo(f,f.careTent.x,floor(0),3.6);
 }else{
  p.mode='medicine';p.clock=0;visit.phase='travel';
  // Hover beside the patient, with a visible gap. Delivery works without movement artwork.
  const gap=(p.bodyWidth||.05)/2+.045,x=Math.max(.03,Math.min(.97,p.x+(p.x>.7?-gap:gap)));
  flyTo(f,x,floor(p.level)-.012,Math.max(2.4,Math.hypot((x-f.x)*1.7,floor(p.level)-f.y)*6));
 }
 return true;
}
function arrive(f,p){f.state='talk';f.clock=0;f.duration=unicornCareSettings.handoffSeconds;f.direction=Math.sign(p.x-f.x)||1;p.direction=-f.direction;p.mode='medicine';p.clock=0;p.emote='ok';p.emoteTime=4;f.careVisit.phase='handoff';}
// Return true while medicine owns flight so normal greetings and toy throws cannot steal it.
export function advanceUnicornCare(f,pets,dt){
 if(!Number.isFinite(dt)||dt<=0)return !!f.careVisit;
 const o=observeOutbreak(f,pets,dt);
 if(!f.careVisit&&o.active&&o.infectedCount>0&&!o.handled&&o.requested&&!f.magicTarget&&['absent','fly','talk'].includes(f.state))startUnicornCare(f,pets,f.random()<unicornCareSettings.deliveryChance?'delivery':'tent');
 const visit=f.careVisit;if(!visit)return false;
 f.age+=dt;visit.age+=dt;
 if(visit.age>=visit.limit){leave(f);return true;}
 const p=visit.target;
 if(p&&(!pets.includes(p)||!ill(p)||!['medicine','clinicWalk'].includes(p.mode))){release(p);visit.target=null;visit.phase='choose';}
 if(f.state==='fly'){
  const t=Math.min(1,f.clock/f.duration),ease=t*t*(3-2*t);f.x=f.fromX+(f.targetX-f.fromX)*ease;f.y=f.fromY+(f.targetY-f.fromY)*ease;
 }
 if(visit.phase==='setup'){
  if(f.clock>=f.duration){f.careTent.ready=true;visit.phase='choose';f.state='talk';f.clock=0;}
 }else if(visit.phase==='choose'){
  if(!choosePatient(f,pets)&&!pets.some(p=>ill(p)&&!visit.served.has(p)))leave(f);
 }else if(visit.phase==='travel'){
  if(f.clock>=f.duration)arrive(f,visit.target);
 }else if(visit.phase==='clinic'){
  const patient=visit.target;visit.wait+=dt;
  if(!hasAction(patient.data,'walking')||visit.wait>25){patient.mode='medicine';visit.phase='travel';flyTo(f,Math.max(.03,Math.min(.97,patient.x+.07)),floor(patient.level)-.012,2.4);}
  else {const delta=patient.clinicTarget-patient.x;patient.direction=Math.sign(delta)||1;patient.x+=patient.direction*Math.min(Math.abs(delta),travelSpeed(patient)*dt);if(Math.abs(delta)<.005&&f.clock>=f.duration)arrive(f,patient);}
 }else if(visit.phase==='handoff'&&f.clock>=unicornCareSettings.handoffSeconds){
  grantUnicornPotion(visit.target,o.ids);visit.served.add(visit.target);visit.visits++;f.potionsDelivered=(f.potionsDelivered||0)+1;visit.target=null;visit.phase='choose';f.feeling='hearts';f.feelingTime=4;
 }
 return true;
}
export function drawUnicornCare(ctx,w,h,f){
 const tent=f.careTent;
 if(tent?.ready){
  const x=tent.x*w,y=floor(tent.level)*h,s=h*.11;
  ctx.save();ctx.fillStyle='#263a59';ctx.fillRect(x-s*.65,y-s*.7,s*1.3,s*.7);ctx.fillStyle='#b3eee2';ctx.beginPath();ctx.moveTo(x-s*.8,y-s*.7);ctx.lineTo(x,y-s*1.35);ctx.lineTo(x+s*.8,y-s*.7);ctx.closePath();ctx.fill();ctx.fillStyle='#7456ab';ctx.fillRect(x-s*.1,y-s*.55,s*.2,s*.4);ctx.fillRect(x-s*.24,y-s*.42,s*.48,s*.14);ctx.fillStyle='#edfdf8';ctx.textAlign='center';ctx.font=`600 ${Math.max(9,h*.015)}px system-ui`;ctx.fillText('POTION POP-UP',x,y-s*1.5);ctx.restore();
 }
 const visit=f.careVisit;
 if(visit?.phase==='handoff'&&visit.target){
  const t=Math.min(1,f.clock/unicornCareSettings.handoffSeconds),p=visit.target,x=(f.x+(p.x-f.x)*t)*w,y=(f.y-.045)*h;
  ctx.save();ctx.fillStyle='#c1f8ee';ctx.fillRect(x-4,y-10,8,12);ctx.fillStyle='#a880dd';ctx.fillRect(x-3,y-14,6,4);ctx.restore();
 }
}
