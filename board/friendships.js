import {trait,love} from './profile.js?v=height1';
import {hasFrames} from './pet-animation.js?v=height1';
export const FRIENDSHIP_SAVE_SECONDS=900;
export const identity=p=>p.data.boardId||p.data.id;
export const closeness=(p,other)=>p.friendships?.get(identity(other))??50;
export function friendshipLevel(score){return score<20?'Strong disagreement':score<40?'Strained':score<55?'Getting acquainted':score<70?'Friendly':score<85?'Good friends':'Best friends';}
export function changeFriendship(p,other,amount){
 p.friendships??=new Map();p.friendshipNames??=new Map();
 const id=identity(other);if(!id||id===identity(p))return;
 p.friendships.set(id,Math.max(0,Math.min(100,closeness(p,other)+amount)));
 p.friendshipNames.set(id,other.data.name||'Cyber Pet');p.friendshipDirty=true;
}
export function rankings(p){
 const rows=[...(p.friendships||[])].map(([id,score])=>({id,name:p.friendshipNames?.get(id)||'Cyber Pet',score:Math.round(score*10)/10,level:friendshipLevel(score)}));
 const tie=(a,b)=>a.id.localeCompare(b.id);
 return {closest:rows.filter(r=>r.score>50).sort((a,b)=>b.score-a.score||tie(a,b)).slice(0,3),leastLiked:rows.filter(r=>r.score<50).sort((a,b)=>a.score-b.score||tie(a,b)).slice(0,3)};
}
export function restoreFriendships(p,record){
 if(!record)return;
 p.friendships=new Map();p.friendshipNames=new Map();
 for(const r of [...(record.closest||[]),...(record.leastLiked||[])]){
  if(typeof r.id==='string'&&Number.isFinite(r.score)&&r.score>=0&&r.score<=100){p.friendships.set(r.id,r.score);p.friendshipNames.set(r.id,r.name);}
 }
 p.friendshipDirty=false;p.friendshipSavedAt=record.updatedAt||null;
}
export const canTalk=p=>hasFrames(p.data,'talk_side');
// Trait differences can create friction; no personality guarantees an argument.
export function conversationKind(a,b){
 const stress=p=>Math.max(0,1-(p.data.stats?.happiness??70)/70);
 const difference=(Math.abs(trait(a,'activity_level')-trait(b,'activity_level'))+Math.abs(trait(a,'curiosity')-trait(b,'curiosity')))/2;
 const assertive=(trait(a,'assertiveness')+trait(b,'assertiveness'))/2;
 const tension=closeness(a,b)<50||closeness(b,a)<50;
 if(tension&&a.random()<.15+.2*(trait(a,'generosity')+trait(b,'generosity'))/2+.1*(trait(a,'bravery')+trait(b,'bravery'))/2+.1*(love(a)+love(b))/2)return 'apology';
 const chance=Math.min(.32,.03+.13*difference+.09*assertive+.07*(stress(a)+stress(b))/2+(tension?.06:0));
 return a.random()<chance?'argument':'friendly';
}
export function beginFriendshipConversation(a,b,afterTag=false){
 const kind=afterTag?'friendly':conversationKind(a,b),g={players:[a,b],kind,time:0,resolved:false};
 for(const p of g.players)p.friendshipConversation=g;
 // Relationship outcomes are expressed visually, without agreement/disagreement text.
 for(const p of g.players){p.speech='';p.speechReply='';p.emote=kind==='argument'?'frustrated':kind==='apology'?'love':'happy';p.socialReply=kind==='argument'?'thinking':'ok';p.emoteTime=6;}

 return g;
}
export function advanceFriendships(pets,dt){
 for(const p of pets){p.friendshipClock=(p.friendshipClock||0)+dt;}
 for(const g of new Set(pets.map(p=>p.friendshipConversation).filter(Boolean))){
  if(g.players.some(p=>!pets.includes(p)||p.mode!=='social'||p.friendshipConversation!==g)){for(const p of g.players)if(p.friendshipConversation===g)p.friendshipConversation=null;continue;}
  g.time+=dt;if(g.resolved||g.time<2.5)continue;g.resolved=true;
  const [a,b]=g.players;
  for(const [p,other] of [[a,b],[b,a]]){
   p.friendshipLast??=new Map();const now=p.friendshipClock||0,previous=p.friendshipLast.get(identity(other));
   if(previous!==undefined&&now-previous<60)continue;
   p.friendshipLast.set(identity(other),now);
   const compatibility=1-Math.abs(trait(p,'curiosity')-trait(other,'curiosity'));
   const amount=g.kind==='argument'?-(2+2*trait(p,'assertiveness')):g.kind==='apology'?3:1+compatibility+.5*trait(p,'sociability')+(canTalk(p)?1:0);
   changeFriendship(p,other,amount);
  }
 }
}
export function drawSpeech(ctx,p,x,y,unit,width){
 if(p.friendshipConversation)return;
 if(p.mode!=='social'||!p.speech||(Math.floor(p.clock/2)+(p.socialTurn||0))%2)return;
 const message=p.speech.slice(0,44);ctx.save();ctx.font=`600 ${Math.max(10,12*unit)}px system-ui`;ctx.textAlign='center';
 const w=Math.min(width-12,ctx.measureText(message).width+16),h=25*unit,center=Math.max(w/2+6,Math.min(width-w/2-6,x)),top=Math.max(6,y-h);
 ctx.fillStyle=p.friendshipConversation?.kind==='argument'?'#fff0dd':'#f8fcff';ctx.strokeStyle='#49728c';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(center-w/2,top,w,h,6);ctx.fill();ctx.stroke();ctx.fillStyle='#203c50';ctx.fillText(message,center,top+h*.68,w-10);ctx.restore();
}
