// Classroom balance: a single wall rebound and a single floor rebound per
// airborne chain. A rebound touching the floor does NOT reset these counters.
// Call resetBounceChain only after the fighter settles, not on bounce contact.
export const BOUNCE_LIMITS=Object.freeze({wall:1,floor:1,total:2});
export function validateBounces(value){
 if(value===undefined)return;
 if(!value||typeof value!=='object'||Array.isArray(value)||!Object.keys(value).length||Object.keys(value).some(k=>!['wall','floor'].includes(k)))throw Error('Choose wall and/or floor bounce settings.');
 for(const rule of Object.values(value)){
  if(!rule||typeof rule!=='object'||Array.isArray(rule)||Object.keys(rule).length!==3||Object.keys(rule).some(k=>!['height','distance','frames'].includes(k)))throw Error('A bounce needs height, distance and frames.');
  for(const [key,min,max] of [['height',1,150],['distance',0,150],['frames',1,120]])if(!Number.isInteger(rule[key])||rule[key]<min||rule[key]>max)throw Error(`Bounce ${key} must be a whole number from ${min} to ${max}.`);
 }
}
export function resetBounceChain(target){target.bounceCounts={wall:0,floor:0};}
// Identify contact from the unclamped sample. Merely resting on a boundary is
// not a new collision. Wall wins an exact corner tie; the upward rebound then
// separates from the floor before it can trigger a later floor bounce.
export function bounceContact(previous,next,minX,maxX){
 if(next.x<=minX&&next.x<previous.x)return {kind:'wall',direction:1};
 if(next.x>=maxX&&next.x>previous.x)return {kind:'wall',direction:-1};
 if(previous.y<0&&next.y>=0&&next.y>previous.y)return {kind:'floor',direction:Math.sign(next.x-previous.x)||1};
 return null;
}
// Returns a shared pulse reaction without applying it. The caller owns contact
// position, hitstun and presentation; a bounce is not another damage contact.
export function claimBounce(target,settings,contact){
 const rule=settings?.[contact?.kind];if(!rule||target.hp<=0||target.juggleLocked)return null;
 validateBounces(settings);
 const counts=target.bounceCounts??{wall:0,floor:0};
 if(counts[contact.kind]>=BOUNCE_LIMITS[contact.kind]||counts.wall+counts.floor>=BOUNCE_LIMITS.total)return null;
 target.bounceCounts={...counts,[contact.kind]:counts[contact.kind]+1};
 return {direction:contact.direction,event:{reaction:'launch',height:rule.height,knockback:rule.distance,frames:rule.frames,hold:1}};
}

export function startBoundaryBounce(target,settings,next,direction,frame,minX,maxX){
 const contact=bounceContact(target,next,minX,maxX);
 if(contact?.kind==='floor'&&next.x===target.x)contact.direction=direction;
 const bounce=claimBounce(target,settings,contact);if(!bounce)return false;
 target.x=Math.max(minX,Math.min(maxX,next.x));target.y=next.y;
 target.legacyMotion=null;target.needsFall=false;
 target.pulseMotion={start:frame,x:target.x,y:target.y,direction:bounce.direction,event:{...bounce.event,bounces:structuredClone(settings)},bounce:true};
 target.reaction='airborne';target.reactionInFlight=true;target.vx=0;target.vy=0;
 target.reactionBounceFrame=frame;target.reactionBounceKind=contact.kind;
 return true;
}
