// Version 2: a bounded sequence of hits timed from first projectile contact.
// Shared by the editor preview and the Arena. All times are 60 Hz frames.
export const SEQUENCE_LIMITS = Object.freeze({hits:10, duration:300, suspension:30, gravity:.48});
export const REACTIONS = ['launch','suspend','relaunch','spike','knockback','none'];
const integer=(value,min,max)=>Number.isInteger(value)&&value>=min&&value<=max;
export function validateHitSequence(attack) {
  if (attack.hitEvents===undefined) {
    if (attack.behaviorVersion!==undefined&&attack.behaviorVersion!==1) throw Error('Missing version 2 hit sequence.');
    return;
  }
  if (attack.behaviorVersion!==2||attack.delivery!=='projectile'||attack.payload!=='damage'||attack.status!=='none'||attack.impactTrigger!=='contact')
    throw Error('Hit sequences require version 2, a contact-triggered damage projectile, and no secondary status.');
  if (!['attached','contact'].includes(attack.projectileMode)) throw Error('Choose attached or repeated-contact projectile behavior.');
  if (!Array.isArray(attack.hitEvents)||!integer(attack.hitEvents.length,1,SEQUENCE_LIMITS.hits)) throw Error('Use 1–10 independent hits.');
  const ids=new Set(); let previous=-1;
  for (const event of attack.hitEvents) {
    if (!event||typeof event.id!=='string'||!/^hit_[a-zA-Z0-9_]{1,80}$/.test(event.id)||ids.has(event.id)) throw Error('Every hit needs a unique ID.');
    ids.add(event.id);
    if (!integer(event.offset,0,SEQUENCE_LIMITS.duration)||event.offset<=previous) throw Error('Hit offsets must increase, starting at contact + 0.');
    if (!integer(event.duration,1,60)||event.offset+event.duration>SEQUENCE_LIMITS.duration) throw Error('Hit windows must end within 300 frames of contact.');
    if (!Number.isFinite(event.damage)||event.damage<0||event.damage>500) throw Error('Hit damage must be 0–500.');
    if (!REACTIONS.includes(event.reaction)||!integer(event.height,0,150)||!integer(event.knockback,0,150)||!integer(event.frames,1,120)||!integer(event.hold,1,SEQUENCE_LIMITS.suspension)) throw Error('Invalid hit reaction.');
    if (!['any','grounded','airborne'].includes(event.target)) throw Error('Invalid hit target restriction.');
    previous=event.offset;
  }
  if (attack.hitEvents[0].offset!==0) throw Error('The first hit starts at contact + 0.');
}
export const sequenceDuration=attack=>Math.max(...attack.hitEvents.map(e=>e.offset+e.duration));
export function jugglePreset(count=5,interval=5) {
  if (!integer(count,1,10)||!integer(interval,1,25)) throw Error('Choose 1–10 hits, 1–25 frames apart.');
  return Array.from({length:count},(_,i)=>({id:'hit_'+crypto.randomUUID().replaceAll('-',''),offset:i*interval,duration:1,
    damage:count===5?[6,3,3,4,12][i]:(i===count-1?12:i===0?6:3),
    reaction:i===count-1?'knockback':i===0?'launch':count===5&&i===3?'relaunch':'suspend',
    height:i===count-1?12:45,knockback:i===count-1?65:0,frames:24,hold:interval,target:'any'}));
}
// Existing hit values and IDs survive Quick Edit. New hits precede the finisher.
export function resizeHits(events,count,interval,mode='extend') {
  if (!integer(count,1,10)||!integer(interval,1,25)||!['extend','fit'].includes(mode)) throw Error('Invalid Quick Edit settings.');
  const result=structuredClone(events),lastTime=events.at(-1).offset;
  while(result.length<count) {
    const last=result.pop(),sample=result.at(-1)||last;
    result.push({...structuredClone(sample),id:'hit_'+crypto.randomUUID().replaceAll('-',''),reaction:'suspend',damage:3,knockback:0},last);
  }
  while(result.length>count) result.splice(Math.max(0,result.length-2),1);
  result.forEach((e,i)=>{e.offset=mode==='fit'&&count>1?Math.round(i*Math.max(lastTime,count-1)/(count-1)):i*interval;});
  return result;
}
export function sequenceState(){return {contactFrame:null,attached:false,consumed:new Set(),results:[],cancelled:null};}
export function sequenceOpportunities(attack,state,age,overlap,target) {
  if(state.cancelled)return [];
  if(state.contactFrame===null){if(!overlap)return [];state.contactFrame=age;}
  const elapsed=age-state.contactFrame,ready=[];
  for(const event of attack.hitEvents){
    if(state.consumed.has(event.id)||elapsed<event.offset)continue;
    if(elapsed>=event.offset+event.duration){state.consumed.add(event.id);state.results.push({id:event.id,offset:event.offset,frame:null,result:'Missed',reason:'No eligible contact during this hit window.'});continue;}
    const eligible=!(target.juggleLocked&&target.y<0)&&(event.target==='any'||(event.target==='airborne'?target.y<0:target.y>=0));
    if(eligible&&(overlap||(attack.projectileMode==='attached'&&state.attached))){state.consumed.add(event.id);ready.push(event);}
  }
  return ready;
}
export function applyPulseReaction(target,event,direction,frame) {
  if(target.y>=0){target.juggleHits=0;target.juggleLocked=false;}
  if(event.reaction==='none')return;
  target.juggleHits=(target.juggleHits||0)+1;
  if(target.juggleHits>=SEQUENCE_LIMITS.hits){target.juggleLocked=true;event={...event,reaction:'knockback',height:0,knockback:30,frames:15};}
  target.pulseMotion={start:frame,x:target.x,y:target.y,direction,event:structuredClone(event)};
  target.reaction=event.reaction==='suspend'||event.height>0||target.y<0?'airborne':'hurt';
  target.reactionStart=frame;target.lastHit=frame;target.vy=0;target.vx=0;
  target.reactionHitFrame=frame;target.reactionDirection=direction;target.reactionLaunched=target.reaction==='airborne';
  target.reactionInFlight=true;target.reactionFlightFrames=event.frames;
  target.stun=Math.max(target.stun||0,frame+(event.reaction==='suspend'?event.hold:event.frames));
}
// Returns true while this shared motion owns position, including its landing frame.
export function advancePulseReaction(target,frame,minX=-Infinity,maxX=Infinity) {
  const motion=target.pulseMotion;if(!motion)return false;
  const e=motion.event,elapsed=frame-motion.start,duration=e.reaction==='suspend'?e.hold:e.frames;
  const t=Math.max(0,Math.min(1,elapsed/duration));
  target.x=Math.max(minX,Math.min(maxX,motion.x+motion.direction*e.knockback*t));
  target.y=e.reaction==='suspend'?motion.y:e.reaction==='spike'?motion.y*(1-t):motion.y*(1-t)-4*e.height*t*(1-t);
  if(t===1){target.pulseMotion=null;target.reactionInFlight=false;target.vy=0;target.reaction=target.y<0?'airborne':'standing';if(target.y===0)target.reactionLandFrame=frame;}
  return true;
}
export function hitResult(state,event,age,result,reason='') {
  const record={id:event.id,offset:event.offset,frame:age,result,reason};state.results.push(record);return record;
}
