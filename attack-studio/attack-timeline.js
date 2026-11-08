import {poseDurations,posePlayback} from './pose-timing.js?v=20261108-cancels';
import {renderHitboxTimeline} from './hitbox-timeline.js?v=20261108-cancels';
import {cycleFrames,retimeVisual} from './vfx-timeline.js?v=20261108-cancels';
import {validateAttack} from './combat-model.js?v=20261108-cancels';
export function timelineTracks(attack,simulation,effects,poseCount=0){
 const startup=simulation.timing.startup,contact=simulation.impactFrame??startup,geometryBase=attack.hitEvents?contact:startup,groups=[];
 if(attack.hitboxGroups)for(const [i,g] of attack.hitboxGroups.entries())groups.push({id:g.id,boxes:g.boxes.map((b,j)=>({...b,start:geometryBase+b.start,minStart:geometryBase,maxStart:geometryBase+attack.active-b.duration,label:`G${i+1} · Box ${j+1}`}))});
 if(attack.hitEvents)groups.push({id:'sequence',boxes:attack.hitEvents.map((h,i)=>({id:h.id,start:contact+h.offset,duration:h.duration,minStart:contact,maxStart:contact+299,lockStart:i===0,label:'Hit '+(i+1)}))});
 const visuals=attack.visuals.flatMap((v,i)=>{const e=effects.get(v.effectId);return e?[{id:String(i),start:v.start,duration:Math.ceil(cycleFrames(e,v)/v.rate),maxStart:600,lockDuration:!!(v.loopUntilImpact||(v.loop??e.loop)),label:`Effect ${i+1}${v.loopUntilImpact?' · to contact':(v.loop??e.loop)?' · repeating cycle':''}`}]:[];});if(visuals.length)groups.push({id:'effects',boxes:visuals});
 if(['block','dodge'].includes(attack.payload))groups.push({id:'defense',boxes:[{id:'window',start:startup,duration:attack.active,lockStart:true,label:attack.payload==='block'?'Block window':'Dodge window'}]});
 if(attack.defenseWindows)groups.push({id:'armor',boxes:attack.defenseWindows.map((w,i)=>({id:w.id,start:w.start,duration:w.duration,maxStart:900-w.duration,label:w.kind==='armor'?`Armor ${i+1} · ${w.hits} hits · ${w.against}`:w.kind==='parry'?`Parry ${i+1} · ${w.hits} hits · ${w.stun}f interruption`:`Invulnerability ${i+1} · ${w.against}`}))});
 if(attack.cancelWindows)groups.push({id:'cancels',boxes:attack.cancelWindows.map((w,i)=>({id:w.id,start:w.start,duration:w.duration,maxStart:900-w.duration,label:`Follow-up ${i+1} · ${w.condition}`}))});
 if(attack.motionPath?.length)groups.push({id:'movement',boxes:[{id:'path',start:0,duration:attack.pathDuration||60,lockStart:true,label:'Movement path'}]});
 if(poseCount>0){const playback=posePlayback(attack,poseCount,0,simulation.timing,simulation.impactFrame);groups.unshift({id:'animation',boxes:[{id:'pose',start:0,duration:Math.max(1,playback.end),lockStart:true,lockDuration:attack.poseTiming!=='custom',label:attack.poseTiming==='custom'?'Animation · custom':'Animation · synced'}]});}
 return {groups,startup,contact,geometryBase,poseCount,frames:Math.max(120,...groups.flatMap(g=>g.boxes.map(b=>b.start+b.duration+30)))};
}
export function editTimeline(attack,tracks,effects,groupId,boxId,window){
 const next=structuredClone(attack);
 if(groupId==='effects'){const i=Number(boxId);next.visuals[i]=retimeVisual(effects.get(next.visuals[i].effectId),next.visuals[i],window);}
 else if(groupId==='sequence'){const hit=next.hitEvents.find(h=>h.id===boxId);hit.offset=window.start-tracks.contact;hit.duration=window.duration;next.active=Math.max(...next.hitEvents.map(h=>h.offset+h.duration));}
 else if(groupId==='animation'){
  if(next.poseTiming!=='custom')throw Error('Choose Custom frame durations in Attacker timing before resizing animation.');
  const durations=poseDurations(next,tracks.poseCount),total=durations.reduce((a,b)=>a+b,0),factor=window.duration/60/total;
  if(!Number.isInteger(window.duration)||window.duration<1||durations.some(d=>d*factor<.02||d*factor>5))throw Error('Animation timing must keep every frame between 0.02 and 5 seconds.');
  next.poseDurations=durations.map(d=>d*factor);
 }
 else if(groupId==='armor'){const defense=next.defenseWindows.find(w=>w.id===boxId);defense.start=window.start;defense.duration=window.duration;}
 else if(groupId==='cancels'){const cancel=next.cancelWindows.find(w=>w.id===boxId);cancel.start=window.start;cancel.duration=window.duration;}
 else if(groupId==='defense'){next.active=window.duration;}
 else if(groupId==='movement'){next.pathDuration=window.duration;}
 else{const box=next.hitboxGroups.find(g=>g.id===groupId).boxes.find(b=>b.id===boxId);box.start=window.start-tracks.geometryBase;box.duration=window.duration;}
 validateAttack(next);return next;
}
export function renderAttackTimeline({root,attack,simulation,effects,commit,poseCount=0}){
 root.replaceChildren();const title=document.createElement('h2');title.textContent='Attack timeline';root.append(title);
 const tracks=timelineTracks(attack,simulation,effects,poseCount),note=document.createElement('p');note.textContent=`All tracks use frames since attack start. Startup ends at ${tracks.startup}. ${attack.hitEvents?(simulation.impactFrame===null?'Contact was not reached; hit tracks use startup as a provisional anchor.':`Contact occurs at ${tracks.contact}; hit tracks remain relative to it.`):''} Repeating effects show one cycle. Synced animation follows combat; choose Custom frame durations to resize it independently. Visual edits do not move damage windows.`;root.append(note);
 const error=document.createElement('p');error.setAttribute('role','status');
 if(tracks.groups.length)renderHitboxTimeline({root,groups:tracks.groups,frames:tracks.frames,title:'Combined attack timing tracks',clockLabel:'Attack frames',onError:m=>error.textContent=m,commit:(g,b,w)=>commit(editTimeline(attack,tracks,effects,g,b,w))});else{const p=document.createElement('p');p.textContent='Add hitbox groups, a hit sequence, effects or a movement path to edit their timing here.';root.append(p);}root.append(error);
}
