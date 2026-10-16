import {clipReady} from './host-interactions.js?v=31';
export const galleryPoses=[['lean','look','hair','delight'],['lean','look','wave','phone']];
export function walkCandidate(h,c){
 if(h.walker||h.pair||h.pendingPair||h.clock<(h.nextWalk??18)||((c.customer||c.queue?.length)&&h.clock<(h.nextWalk??18)+45))return null;
 const preferred=h.nextWalker??0;
 for(const i of [preferred,1-preferred]){if(c.customer&&c.servingHost===i)continue;const clips=h.art['host'+(i+1)];if(clipReady(clips?.walk)&&clipReady(clips?.turn)&&galleryPoses[i].some(a=>clipReady(clips[a])))return i;}
 return null;
}
export function beginHostWalk(h,index){
 const p=h.people[index],clips=h.art['host'+(index+1)],poses=galleryPoses[index].filter(a=>clipReady(clips[a]));
 if(!poses.length||!clipReady(clips.walk)||!clipReady(clips.turn))return false;
 const pose=poses[(p.poseVisit||0)%poses.length];p.poseVisit=(p.poseVisit||0)+1;
 h.walker={index,pose,phase:'turnOut',clock:0,duration:clips.turn.duration,distance:index===0?-.19:.19};
 Object.assign(p,{action:'turn',clock:0,offset:0,walkFacing:index===0?-1:1,reverseTurn:false,reverseWalk:false,heldRest:false,feeling:'',reply:false});h.nextWalker=1-index;return true;
}
export function advanceHostWalk(h,c,dt){
 c.preferredHost=null;const walk=h.walker;if(!walk)return;
 c.preferredHost=1-walk.index;const p=h.people[walk.index],clips=h.art['host'+(walk.index+1)];walk.clock=Math.min(walk.duration,walk.clock+dt);
 const u=walk.clock/walk.duration,ease=u*u*(3-2*u),outward=Math.sign(walk.distance);
 if(walk.phase==='pose'){p.action=walk.pose;p.clock=walk.clock;p.offset=walk.distance;p.walkFacing=1;}
 else if(['out','back'].includes(walk.phase)){p.action='walk';p.clock=walk.clock%clips.walk.duration;p.reverseWalk=false;p.walkFacing=walk.phase==='out'?outward:-outward;const previousOffset=p.offset||0;p.offset=walk.distance*(walk.phase==='out'?ease:1-ease);p.travelFacing=Math.sign(p.offset-previousOffset)||p.walkFacing;}
 else {p.action='turn';p.clock=walk.clock;p.reverseTurn=['faceOut','faceHome'].includes(walk.phase);p.walkFacing=['turnOut','faceOut'].includes(walk.phase)?outward:-outward;p.offset=['faceOut','turnBack'].includes(walk.phase)?walk.distance:0;}
 if(walk.clock<walk.duration)return;
 const next={turnOut:'out',out:'faceOut',faceOut:'pose',pose:'turnBack',turnBack:'back',back:'faceHome'}[walk.phase];
 if(next){walk.phase=next;walk.clock=0;walk.duration=next==='pose'?clips[walk.pose].duration:['out','back'].includes(next)?3*clips.walk.duration:clips.turn.duration;advanceHostWalk(h,c,0);}
 else {Object.assign(p,{action:'idle',clock:0,offset:0,walkFacing:1,reverseTurn:false,reverseWalk:false,nextBreak:h.clock+8});h.walker=null;h.nextWalk=h.clock+18+h.random()*12;h.pairNotBefore=h.clock+5;}
}
