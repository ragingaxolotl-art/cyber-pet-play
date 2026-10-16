import {clipReady} from './host-interactions.js?v=23';
export const galleryPoses=[['look','hair','delight'],['look','wave','phone']];
export function walkCandidate(h,c){
 if(h.walker||h.pair||h.pendingPair||c.customer||c.queue?.length||h.clock<(h.nextWalk??18))return null;
 const preferred=h.nextWalker??0;
 for(const i of [preferred,1-preferred]){const clips=h.art['host'+(i+1)];if(clipReady(clips?.walk)&&galleryPoses[i].some(a=>clipReady(clips[a])))return i;}
 return null;
}
export function beginHostWalk(h,index){
 const p=h.people[index],clips=h.art['host'+(index+1)],poses=galleryPoses[index].filter(a=>clipReady(clips[a]));
 if(!poses.length||!clipReady(clips.walk))return false;
 const pose=poses[(p.poseVisit||0)%poses.length];p.poseVisit=(p.poseVisit||0)+1;
 h.walker={index,pose,phase:'out',clock:0,duration:3*clips.walk.duration,distance:index===0?-.19:.19};
 Object.assign(p,{action:'walk',clock:0,offset:0,reverseWalk:false,heldRest:false,feeling:'',reply:false});h.nextWalker=1-index;return true;
}
export function advanceHostWalk(h,c,dt){
 c.preferredHost=null;const walk=h.walker;if(!walk)return;
 c.preferredHost=1-walk.index;const p=h.people[walk.index],clips=h.art['host'+(walk.index+1)];walk.clock=Math.min(walk.duration,walk.clock+dt);
 const u=walk.clock/walk.duration,ease=u*u*(3-2*u);
 if(walk.phase==='pose'){p.action=walk.pose;p.clock=walk.clock;p.offset=walk.distance;}
 else {p.action='walk';p.clock=walk.clock%clips.walk.duration;p.reverseWalk=walk.phase==='back';p.offset=walk.distance*(walk.phase==='out'?ease:1-ease);}
 if(walk.clock<walk.duration)return;
 if(walk.phase==='out'){walk.phase='pose';walk.clock=0;walk.duration=clips[walk.pose].duration;p.action=walk.pose;p.clock=0;}
 else if(walk.phase==='pose'){walk.phase='back';walk.clock=0;walk.duration=3*clips.walk.duration;p.action='walk';p.clock=0;p.reverseWalk=true;}
 else {Object.assign(p,{action:'idle',clock:0,offset:0,reverseWalk:false,nextBreak:h.clock+8});h.walker=null;h.nextWalk=h.clock+18+h.random()*12;h.nextPair=Math.max(h.nextPair,h.clock+5);}
}
