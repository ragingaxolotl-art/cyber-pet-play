import {renderHitboxTimeline} from './hitbox-timeline.js?v=20261108-automatic';
export function cycleFrames(effect,visual){return (visual.frames||effect.times.map((_,i)=>i)).reduce((n,i)=>n+(effect.times[i]??effect.times[0]),0)*60/1000;}
export function retimeVisual(effect,visual,window){
 if(!Number.isInteger(window.start)||window.start<0||window.start>600)throw Error('Effect start must be between 0 and 600 frames.');
 const next={...visual,start:window.start},duration=Math.ceil(cycleFrames(effect,visual)/visual.rate);
 if(window.duration!==duration){
  if(visual.loopUntilImpact||(visual.loop??effect.loop))throw Error('Use playback settings to change a looping effect.');
  const rate=cycleFrames(effect,visual)/window.duration;
  if(!Number.isFinite(rate)||rate<.25||rate>4)throw Error('Effect duration exceeds the allowed playback speed (0.25–4).');next.rate=rate;
 }return next;
}
export function renderVfxTimeline({root,attack,effects,commit}){
 const boxes=attack.visuals.flatMap((v,i)=>{const effect=effects.get(v.effectId);return effect?[{id:String(i),start:v.start,duration:Math.ceil(cycleFrames(effect,v)/v.rate),maxStart:600,lockDuration:!!(v.loopUntilImpact||(v.loop??effect.loop)),label:`Effect ${i+1}${v.loopUntilImpact?' · loops to contact':(v.loop??effect.loop)?' · repeating cycle':''}`}]:[];});
 if(!boxes.length)return;
 const note=document.createElement('p');note.textContent='VFX timing is independent of damage. Looping tracks display one cycle; their end handle is disabled.';root.append(note);
 const error=document.createElement('p');error.setAttribute('role','status');
 renderHitboxTimeline({root,groups:[{id:'effects',boxes}],frames:Math.max(120,...boxes.map(b=>b.start+b.duration+30)),title:'Visual effect timing tracks',clockLabel:'Frames since attack start',onError:message=>error.textContent=message,commit:(_,id,window)=>{const index=Number(id),v=attack.visuals[index];commit(index,retimeVisual(effects.get(v.effectId),v,window));}});root.append(error);
}
