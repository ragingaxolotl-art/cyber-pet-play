import {createPresentationCursor,advancePresentationSounds,presentationFrame} from './presentation-events.js?v=20261109-slow-motion-release';
// Adapters supply live cast identities and combat ages. This controller never
// owns fighters, changes time, or extends an attack to finish an effect.
export function createPresentationPlayer(audio){
 const casts=new Map();let lastPaused=false;
 return {
  reset(){audio.stop();casts.clear();lastPaused=false;},
  sample(sources,{paused=false,seeking=false,muted=false,volume=.5,reducedMotion=false}={}){
   audio.preferences({muted,volume});if((paused&&!lastPaused)||seeking)audio.stop();lastPaused=paused;
   const present=new Set(sources.map(s=>s.key));
   for(const key of casts.keys())if(!present.has(key)){audio.stop(key);casts.delete(key);}
   const camera={x:0,y:0,zoom:1};
   for(const source of sources){
    if(!source.key||!Number.isInteger(source.age)||source.age<0)continue;
    let cursor=casts.get(source.key);if(!cursor){cursor=createPresentationCursor();casts.set(source.key,cursor);}
    if(source.interrupted){audio.stop(source.key);cursor.cancelled=true;}
    const sounds=advancePresentationSounds(cursor,source.events,source.age,{muted:muted||paused,seeking,interrupted:source.interrupted});
    for(const sound of sounds)audio.play(sound,source.key);
    if(cursor.cancelled)continue;
    const frame=presentationFrame(source.events,source.age,{reducedMotion});camera.x+=frame.x;camera.y+=frame.y;camera.zoom=Math.max(camera.zoom,frame.zoom);
   }
   camera.x=Math.max(-8,Math.min(8,camera.x));camera.y=Math.max(-8,Math.min(8,camera.y));return camera;
  }
 };
}
