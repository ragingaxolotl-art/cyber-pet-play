// Optional velocity-based target reactions. Legacy arcs remain the default.
// Units: arena pixels and 60 Hz combat frames; positive vertical points down.
export const IMPULSE_MODES=Object.freeze(['replace','add','extend','suspend','redirect','ignore']);
export const IMPULSE_LIMITS=Object.freeze({speed:20,gravity:2,frames:120});
export function validateImpulseReaction(rule){
 if(rule===undefined)return;
 if(!rule||typeof rule!=='object'||Array.isArray(rule)||Object.keys(rule).some(k=>!['mode','horizontal','vertical','gravity','drag','duration'].includes(k)))throw Error('Choose valid impulse reaction settings.');
 if(!IMPULSE_MODES.includes(rule.mode))throw Error('Choose a momentum mode.');
 for(const key of ['horizontal','vertical'])if(!Number.isFinite(rule[key])||Math.abs(rule[key])>20)throw Error('Impulse speed must be between −20 and 20 pixels per frame.');
 if(!Number.isFinite(rule.gravity)||rule.gravity<0||rule.gravity>2)throw Error('Gravity must be 0–2 pixels per frame squared.');
 if(!Number.isFinite(rule.drag)||rule.drag<0||rule.drag>1)throw Error('Horizontal drag must be 0–1.');
 if(!Number.isInteger(rule.duration)||rule.duration<1||rule.duration>120)throw Error('Impulse duration must be 1–120 frames.');
 if(rule.mode==='suspend'&&rule.duration>30)throw Error('Suspension is limited to 30 frames per hit.');
 if(rule.mode==='redirect'&&rule.horizontal===0&&rule.vertical===0)throw Error('Choose a direction for redirected momentum.');
}
const clamp=v=>Math.max(-20,Math.min(20,v));
export function createImpulseMotion(position,velocity,rule,direction,frame){
 validateImpulseReaction(rule);
 if(!rule||!Number.isFinite(position.x)||!Number.isFinite(position.y)||!Number.isFinite(velocity.x)||!Number.isFinite(velocity.y)||![-1,1].includes(direction)||!Number.isInteger(frame))throw Error('An impulse needs a valid position, velocity, facing and combat frame.');
 if(rule.mode==='ignore')return null; // Caller preserves the current reaction.
 let x=velocity.x,y=velocity.y;
 if(rule.mode==='replace'){x=rule.horizontal*direction;y=rule.vertical;}
 if(rule.mode==='add'){x+=rule.horizontal*direction;y+=rule.vertical;}
 if(rule.mode==='redirect'){const speed=Math.min(20,Math.hypot(x,y)),length=Math.hypot(rule.horizontal,rule.vertical);x=speed*rule.horizontal*direction/length;y=speed*rule.vertical/length;}
 return {x:position.x,y:position.y,vx:clamp(x),vy:clamp(y),start:frame,lastFrame:frame,end:frame+rule.duration,rule:structuredClone(rule),finished:false};
}
// One deterministic step per combat frame; repeated render/hitstop frames do not
// advance it. The caller resolves returned boundary contact and optional bounces.
export function stepImpulseMotion(motion,frame,{minX=-Infinity,maxX=Infinity}={}){
 if(!Number.isInteger(frame)||frame<motion.lastFrame||typeof minX!=='number'||typeof maxX!=='number'||Number.isNaN(minX)||Number.isNaN(maxX)||minX>maxX)throw Error('Impulse frames must advance monotonically within valid stage bounds.');
 if(motion.finished||frame===motion.lastFrame)return {x:motion.x,y:motion.y,done:motion.finished,contact:null};
 let contact=null;
 while(motion.lastFrame<frame&&!motion.finished){
  motion.lastFrame++;
  if(motion.rule.mode!=='suspend'){
   const previousY=motion.y;motion.vy=clamp(motion.vy+motion.rule.gravity);
   const nextX=motion.x+motion.vx,nextY=motion.y+motion.vy;
   if(nextX<minX||nextX>maxX){contact={kind:'wall',direction:nextX<minX?1:-1};motion.vx=0;}
   motion.x=Math.max(minX,Math.min(maxX,nextX));motion.y=Math.min(0,nextY);
   if(previousY<0&&nextY>=0){contact??={kind:'floor',direction:Math.sign(motion.vx)||1};motion.vy=0;motion.finished=true;}
   else if(nextY>=0&&motion.vy>0)motion.vy=0;
   motion.vx*=motion.rule.drag;
  }
  if(motion.lastFrame>=motion.end)motion.finished=true;
  if(contact)break; // Let the owner process a bounce before advancing further.
 }
 return {x:motion.x,y:motion.y,done:motion.finished,contact};
}
// Extending an already-running physical reaction preserves its trajectory,
// forces and last sampled frame. It never revives a reaction that has landed.
export function extendImpulseMotion(motion,frames){
 if(!Number.isInteger(frames)||frames<1||frames>120)throw Error('Extend by 1–120 frames.');
 if(!motion||motion.finished)throw Error('Only an active impulse reaction can be extended.');
 const next=structuredClone(motion);
 next.end=Math.min(next.lastFrame+120,next.end+frames);
 return next;
}
