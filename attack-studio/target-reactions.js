// Presentation only: reaction poses do not change combat hitboxes or damage.
export const REACTION_TIMING = Object.freeze({wall:10,landing:12,fall:12,down:30,getUp:32});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function targetReaction(target,frame,{guard=false}={}){
 const direction=target.reactionDirection??1;
 const result=(label,pose='ready_side',progress=.1,angle=0,sequence=null,offsetX=0)=>({label,pose,progress:clamp(progress,0,.999),angle,sequence,offsetX});
 const hit=target.reactionHitFrame,wall=target.reactionWallFrame,land=target.reactionLandFrame;
 const hitAge=Number.isFinite(hit)?frame-hit:Infinity;
  if(Number.isFinite(wall)&&frame-wall<REACTION_TIMING.wall)return result('Wall impact','hurt_side',.9,0,[2],-direction*Math.abs(Math.sin((frame-wall)*2))*2);
 if(target.reactionInFlight&&target.reactionLaunched){

  const t=clamp((frame-hit)/(target.reactionFlightFrames||36),0,1);
  return result(t<.5?'Launched':'Falling','hurt_side',.9,direction*(32+38*Math.sin(Math.PI*t)),[2]);
 }
 if(target.hp<=0){
  const age=Number.isFinite(land)?frame-land:hitAge;
  return result('Knocked out','defeated_side',Number.isFinite(age)?age/18:.999);
 }
 if(Number.isFinite(land)){
  const age=frame-land-(Number.isFinite(wall)?Math.max(0,wall+REACTION_TIMING.wall-land):0);
  if(target.reactionKnockedDown){
   if(age<REACTION_TIMING.fall)return result('Knockdown','knocked_down_side',age/REACTION_TIMING.fall,0,[1,2,3,4]);
   if(age<REACTION_TIMING.down)return result('Down','knocked_down_side',.999,0,[4]);
   if(age<REACTION_TIMING.down+REACTION_TIMING.getUp)return result('Getting up','get_up_side',(age-REACTION_TIMING.down)/REACTION_TIMING.getUp);
  }else if(age<REACTION_TIMING.landing)return result('Landing','jump_side',age/REACTION_TIMING.landing,0,[8,9,0]);
 }
 if(target.reactionInFlight&&Number.isFinite(wall))return result('Wall impact','hurt_side',.9,0,[2]);
 if(Number.isFinite(target.reactionGuardFrame)&&frame-target.reactionGuardFrame<12)return result('Blocked hit','guard_side',.9,0,[1]);
 if(hitAge<Math.max(12,(target.stun??0)-(hit??0)))return result('Hit-stun','hurt_side',Math.min(.99,hitAge/12),direction*8,[0,1,2,1]);
 if((target.stun??0)>frame)return result('Stunned','hurt_side',.5,0,[1]);
 return guard?result('Guarding','guard_side',.1):result('Ready');
}

// Keep wide prone/get-up poses inside the visible wall without changing combat coordinates.
export function fitReactionX(x,width){return Math.max(-234+width/2,Math.min(234-width/2,x));}
