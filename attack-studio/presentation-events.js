// Presentation-only events use 60 Hz combat frames. No combat state is mutated.
export const PRESENTATION_LIMITS=Object.freeze({events:24,endFrame:900,soundFrames:60,cameraFrames:120,shakePixels:8,zoom:1.5});
export const SOUND_PRESETS=Object.freeze(['impact','whoosh','zap','chime']);
const int=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
const number=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
export function validatePresentationEvents(events){
 if(events===undefined)return;
 if(!Array.isArray(events)||!int(events.length,1,PRESENTATION_LIMITS.events))throw Error('Use 1–24 presentation events.');
 const ids=new Set();
 for(const e of events){
  if(!e||typeof e!=='object'||Array.isArray(e)||typeof e.id!=='string'||!/^present_[a-zA-Z0-9_]{1,80}$/.test(e.id)||ids.has(e.id))throw Error('Presentation events need unique IDs.');
  ids.add(e.id);
  const keys=e.kind==='sound'?['id','kind','start','duration','preset','volume']:['id','kind','start','duration','amount'];
  if(Object.keys(e).some(k=>!keys.includes(k))||!['sound','shake','zoom'].includes(e.kind))throw Error('Choose sound, shake or zoom settings.');
  if(!int(e.start,0,899)||!int(e.duration,1,e.kind==='sound'?60:120)||e.start+e.duration>900)throw Error('Presentation timing must end within 900 combat frames.');
  if(e.kind==='sound'&&(!SOUND_PRESETS.includes(e.preset)||!number(e.volume,0,1)))throw Error('Choose a sound preset and volume 0–1.');
  if(e.kind==='shake'&&!number(e.amount,0,8))throw Error('Shake must be 0–8 arena pixels.');
  if(e.kind==='zoom'&&!number(e.amount,1,1.5))throw Error('Zoom must be 1–1.5 times.');
 }
}
export function presentationFrame(events,age,{reducedMotion=false}={}){
 const camera={x:0,y:0,zoom:1};
 if(reducedMotion||!Number.isFinite(age)||age<0)return camera;
 for(const e of events||[]){
  const t=age-e.start;if(t<0||t>=e.duration)continue;
  const fade=1-t/e.duration;
  if(e.kind==='shake'){camera.x+=Math.sin(t*2.4)*e.amount*fade;camera.y+=Math.cos(t*1.7)*e.amount*.5*fade;}
  if(e.kind==='zoom')camera.zoom=Math.max(camera.zoom,1+(e.amount-1)*Math.sin(Math.PI*t/e.duration));
 }
 camera.x=Math.max(-8,Math.min(8,camera.x));camera.y=Math.max(-8,Math.min(8,camera.y));return camera;
}
// One cursor per cast. Seek/reset synchronizes without replaying old sounds.
// Call on combat advancement, not each browser render; hitstop repeats no sounds.
export function createPresentationCursor(){return {age:-1,played:new Set(),cancelled:false};}
export function advancePresentationSounds(cursor,events,age,{muted=false,seeking=false,interrupted=false}={}){
 if(!Number.isInteger(age)||age<0)throw Error('Use a nonnegative combat frame.');
 if(interrupted)cursor.cancelled=true;
 const previous=cursor.age;if(age<previous){cursor.played.clear();seeking=true;}
 cursor.age=age;const sounds=[];
 for(const e of events||[]){
  if(e.kind!=='sound'||e.start>age||cursor.played.has(e.id))continue;
  cursor.played.add(e.id);
  if(!muted&&!seeking&&!cursor.cancelled&&e.start>previous&&age<e.start+e.duration)sounds.push({...e,remainingFrames:e.start+e.duration-age});
 }
 return sounds;
}
