import {renderHitboxTimeline} from './hitbox-timeline.js?v=20261106-timeline';
import {cycleFrames,retimeVisual} from './vfx-timeline.js?v=20261106-timeline';
import {validateAttack} from './combat-model.js?v=20261106-timeline';
export function timelineTracks(attack,simulation,effects){
 const startup=simulation.timing.startup,contact=simulation.impactFrame??startup,groups=[];
 if(attack.hitboxGroups)for(const [i,g] of attack.hitboxGroups.entries())groups.push({id:g.id,boxes:g.boxes.map((b,j)=>({...b,start:startup+b.start,minStart:startup,maxStart:startup+attack.active-b.duration,label:`G${i+1} · Box ${j+1}`}))});
 if(attack.hitEvents)groups.push({id:'sequence',boxes:attack.hitEvents.map((h,i)=>({id:h.id,start:contact+h.offset,duration:h.duration,minStart:contact,maxStart:contact+299,lockStart:i===0,label:'Hit '+(i+1)}))});
 const visuals=attack.visuals.flatMap((v,i)=>{const e=effects.get(v.effectId);return e?[{id:String(i),start:v.start,duration:Math.ceil(cycleFrames(e,v)/v.rate),maxStart:600,lockDuration:!!(v.loopUntilImpact||(v.loop??e.loop)),label:`Effect ${i+1}${v.loopUntilImpact?' · to contact':(v.loop??e.loop)?' · repeating cycle':''}`}]:[];});if(visuals.length)groups.push({id:'effects',boxes:visuals});
 if(attack.motionPath?.length)groups.push({id:'movement',boxes:[{id:'path',start:0,duration:attack.pathDuration||60,lockStart:true,label:'Movement path'}]});
 return {groups,startup,contact,frames:Math.max(120,...groups.flatMap(g=>g.boxes.map(b=>b.start+b.duration+30)))};
}
export function editTimeline(attack,tracks,effects,groupId,boxId,window){
 const next=structuredClone(attack);
 if(groupId==='effects'){const i=Number(boxId);next.visuals[i]=retimeVisual(effects.get(next.visuals[i].effectId),next.visuals[i],window);}
 else if(groupId==='sequence'){const hit=next.hitEvents.find(h=>h.id===boxId);hit.offset=window.start-tracks.contact;hit.duration=window.duration;next.active=Math.max(...next.hitEvents.map(h=>h.offset+h.duration));}
 else if(groupId==='movement'){next.pathDuration=window.duration;}
 else{const box=next.hitboxGroups.find(g=>g.id===groupId).boxes.find(b=>b.id===boxId);box.start=window.start-tracks.startup;box.duration=window.duration;}
 validateAttack(next);return next;
}
export function renderAttackTimeline({root,attack,simulation,effects,commit}){
 root.replaceChildren();const title=document.createElement('h2');title.textContent='Attack timeline';root.append(title);
 const tracks=timelineTracks(attack,simulation,effects),note=document.createElement('p');note.textContent=`All tracks use frames since attack start. Startup ends at ${tracks.startup}. ${attack.hitEvents?(simulation.impactFrame===null?'Contact was not reached; hit tracks use startup as a provisional anchor.':`Contact occurs at ${tracks.contact}; hit tracks remain relative to it.`):''} Repeating effects show one cycle. Visual edits do not move damage windows.`;root.append(note);
 const error=document.createElement('p');error.setAttribute('role','status');
 if(tracks.groups.length)renderHitboxTimeline({root,groups:tracks.groups,frames:tracks.frames,title:'Combined attack timing tracks',clockLabel:'Attack frames',onError:m=>error.textContent=m,commit:(g,b,w)=>commit(editTimeline(attack,tracks,effects,g,b,w))});else{const p=document.createElement('p');p.textContent='Add hitbox groups, a hit sequence, effects or a movement path to edit their timing here.';root.append(p);}root.append(error);
}
