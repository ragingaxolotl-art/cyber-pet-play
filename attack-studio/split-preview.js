import {simulateRuntimeAttack} from './runtime-preview.js?v=20261109-melee-clashes';
import {timing,statsFor,magnitude,worldBox} from './combat-model.js?v=20261109-melee-clashes';
import {sequenceDuration} from './hit-sequence.js';
import {presentationFrames} from './preview-clock.js';

// Adapt shared Arena coordinates and ticks to the existing Studio canvas contract.
export function simulateSplitPreview(attack,attacker,target,options={}) {
 const origin=480, tm=timing(attack,attacker);
 if(attack.hitEvents)tm.active=sequenceDuration(attack);
 const end=Math.min(1800,Math.max(180,tm.startup+attack.projectileLifetime+attack.projectileSplit.lifetime+(attack.projectileArea?.duration??0)+attack.statusDuration+attack.flightFrames, (options.incomingFrame??0)+120,(options.recoveryFrame??0)+120));
 const result=simulateRuntimeAttack(attack,attacker,target,{...options,attackerX:origin,targetX:origin+(options.targetSide??1)*(options.distance??100),frames:end,selfHP:options.selfHP??.6,targetHP:options.targetHP??.7});
 const comboNames=chains=>chains.map(c=>({...c,attacker:c.attacker===0?'self':'target',target:c.target===0?'self':'target'}));
 const events=[],frames=[],hitResults=[];let hits=0,areaHits=0,impactFrame=null;
 const box=b=>({...b,x:b.x-origin});
 const actor=f=>{const next={...f,x:f.x-origin};for(const key of ['stun','reactionStart','reactionUntil','lastHit','hitstunUntil'])if(Number.isFinite(next[key]))next[key]--;return next;};
 const samples=result.frames.length?result.frames:[result.final];
 for(const shot of samples){
  hitResults.push(...shot.hitResults.filter(r=>r.owner===0).map(r=>({...r,frame:r.frame===null?null:r.frame-1})));
  const frame=frames.length,self=actor(shot.fighters[0]),other=actor(shot.fighters[1]);
  for(const hit of shot.feedback||[])if(hit.attacker===0){hits++;impactFrame??=frame;events.push({frame,text:`${hit.outcome}: ${hit.damage} damage`});}
  areaHits+=shot.areaContacts.filter(c=>c.owner===0&&!c.parried).length;
  const projectiles=shot.projectiles.map(p=>({...p,box:box(p.box),boxes:p.boxes?.map(box),steering:p.steering?{...p.steering,x:p.steering.x-origin}:null,splitRay:p.splitRay?{...p.splitRay,x:p.splitRay.x-origin}:null}));
  const boxes=projectiles.flatMap(p=>p.boxes||[p.box]);
  const primary=boxes[0]||worldBox(attack,frame,attacker,options.facing??1);
  frames.push({frame,attackerHurtboxes:self.hurtboxes?.map(box),self,target:other,projectiles,box:primary,boxes,targetBox:{x:other.x-14,y:other.y-60,w:28,h:60},areas:shot.areas.map(box),hits,areaHits,active:projectiles.length>0,ownerActive:self.ownerActive,projectileAlive:projectiles.length>0,steering:projectiles[0]?.steering??null,impactStop:shot.hitstopRemaining,contact:shot.feedback.length>0,combos:comboNames(shot.combos),modifiers:shot.fighters.flatMap((f,index)=>f.statuses.map(s=>({recipient:index?'target':'self',kind:s.type,power:s.power,remaining:s.until-shot.frame})))});
 }
 if(result.reason)events.push({frame:0,text:result.reason});
 if(result.incoming?.attempted)events.push({frame:result.incoming.combatFrame,text:result.incoming.started?'Incoming test hit attempted':result.incoming.reason});
 return {stageBounds:{left:35-origin,right:925-origin},frames,events,cast:result.started,cost:Math.ceil(attack.cost*statsFor(attacker).cost),power:magnitude(attack,attacker),timing:tm,impactFrame,contactMode:attack.impactTrigger==='contact',nextCast:Math.max(attack.cooldown,tm.startup+tm.active+tm.recovery),recovery:result.recovery,combos:comboNames(result.final.combos),hitResults:attack.hitEvents?hitResults:undefined,presentationFrames:presentationFrames(frames)};
}
