import {trait,expression,love,travelSpeed,traitFeeling,willing} from './profile.js?v=17';
import {floor,hasAction,tuning,addWalkingDirt,standBeside} from './motion.js?v=17';
export const gameKinds=['hide','follow','race','freeze','copy','ball','balloon','treasure','favorites'];
const active=p=>hasAction(p.data,'walking');
const eligible=p=>!p.stair&&!p.socialGroup&&!p.playGroup&&['idle','walk'].includes(p.mode)&&p.socialCooldown<=0&&(p.data.stats?.energy??100)>12;
const feeling=(p,e)=>{p.emote=e;p.emoteTime=3;};
export function chooseGame(p){
 const choices=[['hide',.3+trait(p,'curiosity')],['follow',.3+trait(p,'sociability')],['race',.2+trait(p,'activity_level')],['freeze',.4],['copy',.5+trait(p,'sociability')],['ball',.5],['balloon',.4+trait(p,'activity_level')],['treasure',.3+trait(p,'curiosity')],['favorites',.3+trait(p,'generosity')]];
 let n=p.random()*choices.reduce((s,c)=>s+c[1],0);for(const [kind,w] of choices){n-=w;if(n<=0)return kind;}return 'copy';
}
export function startGame(players,kind,rematch=0){
 if(players.length<2||!gameKinds.includes(kind)||players.some(p=>p.level!==players[0].level)||(!['copy','favorites'].includes(kind)&&players.some(p=>!active(p))))return null;
 players=[...players].sort((a,b)=>trait(b,'assertiveness')-trait(a,'assertiveness'));
 const center=Math.max(.25,Math.min(.75,players.reduce((n,p)=>n+p.x,0)/players.length));
 const g={players,kind,time:0,center,level:players[0].level,rematch,duration:10+Math.min(...players.map(p=>trait(p,'activity_level')+trait(p,'sociability')+love(p)))*5,target:Math.min(.92,center+.2),propX:center,propY:floor(players[0].level)-.04};
 players.forEach((p,i)=>{p.mode='game';p.playGroup=g;p.clock=0;p.gameOrigin=p.x;p.gameSlot=center+(i-(players.length-1)/2)*.085;p.gameMoving=false;p.socialCooldown=40;feeling(p,i===0?'eager':'question');});return g;
}
function move(p,target,dt,multiplier=1){const delta=target-p.x,step=Math.min(Math.abs(delta),travelSpeed(p)*multiplier*dt);p.gameMoving=step>.00001;if(step){p.direction=Math.sign(delta);p.x+=p.direction*step;addWalkingDirt(p,step);}}
function finish(g,allowRematch=true){
 for(const p of g.players){p.playGroup=null;p.gameMoving=false;p.worldBob=0;p.displayItem=null;p.mode='idle';p.timer=2;p.socialCooldown=30+p.random()*20;feeling(p,traitFeeling(p,'sociability'));}
 const sorted=[...g.players].sort((a,b)=>a.x-b.x);for(let i=1;i<sorted.length;i++)if(active(sorted[i-1])&&active(sorted[i]))standBeside(sorted[i-1],sorted[i]);
 if(allowRematch&&!g.rematch&&g.players.every(p=>(p.data.stats?.energy??100)>25)&&g.players[0].random()<trait(g.players[0],'activity_level')*.3)startGame(g.players,g.kind,1);
}
export function advanceGames(pets,dt,time){
 const present=new Set(pets),groups=new Set(pets.map(p=>p.playGroup).filter(Boolean));
 for(const g of groups){
  if(g.players.some(p=>!present.has(p)||p.mode!=='game'||p.level!==g.level)||(!['copy','favorites'].includes(g.kind)&&g.players.some(p=>!active(p)))){finish(g,false);continue;}
  g.time+=dt;const turn=Math.floor(g.time/2),n=g.players.length;
  for(const [i,p] of g.players.entries()){
   p.gameMoving=false;p.worldBob=0;
   if(g.kind==='race'){move(p,g.target,dt,1.3);if(Math.abs(p.x-g.target)<.003){if(g.winner===undefined)g.winner=i;feeling(p,i===g.winner?'eager':love(p)>=.5?'hearts':'frustrated');}}
   else if(g.kind==='follow'){move(p,Math.max(.08,Math.min(.92,g.center+Math.sin(g.time*.22)*.16-i*.075)),dt);}
   else if(g.kind==='hide'){const hideX=Math.max(.08,Math.min(.92,g.center+(i%2?1:-1)*(.08+i*.03)));if(i>0)move(p,hideX,dt);else if(g.time>4)move(p,g.players[1+Math.floor((g.time-4)/5)%(n-1)].x,dt);else feeling(p,'thinking');if(i===0&&g.players.some((other,j)=>j>0&&Math.abs(other.x-p.x)<.035))feeling(p,traitFeeling(p,'sociability'));}
   else if(g.kind==='freeze'){const frozen=g.time%5>3;p.worldBob=frozen?0:Math.abs(Math.sin(g.time*6+i))*.007;feeling(p,frozen?'silence':'laughing');}
   else if(g.kind==='copy'){const emotes=['eager','question','cute','laughing'];feeling(p,emotes[Math.max(0,turn-(i?1:0))%4]);}
   else if(g.kind==='ball'||g.kind==='balloon'){move(p,p.gameSlot,dt);p.direction=p.x<g.propX?1:-1;if(Math.abs(p.x-g.propX)<.035)feeling(p,'eager');}
   else if(g.kind==='treasure'){move(p,Math.max(.08,Math.min(.92,g.target-i*.07)),dt);feeling(p,Math.abs(p.x-g.target)<.04?'eager':'question');}
   else if(g.kind==='favorites'){p.displayItem=g.time>3?g.players[(i+1)%n].data.food:null;feeling(p,g.time<3?'question':p.knownFavorites?.has(g.players[(i+1)%n].data.id)?'hearts':'thinking');}
  }
  if(g.kind==='ball'||g.kind==='balloon'){const left=g.players[0].gameSlot,right=g.players[n-1].gameSlot;g.propX=left+(right-left)*(.5+.5*Math.sin(g.time*1.4));g.propY=floor(g.level)-(g.kind==='ball'?.012:.11+Math.abs(Math.sin(g.time*1.4))*.035);}
  if(g.time>=g.duration||(g.kind==='race'&&g.players.every(p=>Math.abs(p.x-g.target)<.003)))finish(g);
 }
 // One invitation attempt per pet every few seconds; existing care/social actions take priority.
 const epoch=Math.floor(time/5);
 for(const leader of pets){if(!eligible(leader)||leader.gameAttempt===epoch)continue;leader.gameAttempt=epoch;if(leader.random()>.15+trait(leader,'activity_level')*.2+trait(leader,'sociability')*.2)continue;
  const neighbors=pets.filter(p=>p!==leader&&eligible(p)&&p.level===leader.level&&Math.abs(p.x-leader.x)<.22).filter(p=>willing(p,leader)).slice(0,3);if(!neighbors.length)continue;
  const kind=chooseGame(leader),players=[leader,...neighbors].filter(p=>['copy','favorites'].includes(kind)||active(p));startGame(players,kind);
 }
}
export function drawGames(c,w,h,pets,time){
 for(const g of new Set(pets.map(p=>p.playGroup).filter(Boolean))){
  const y=floor(g.level)*h;
  if(g.kind==='ball'||g.kind==='balloon'){c.fillStyle=g.kind==='ball'?'#f6ba62':'#ef99bd';c.beginPath();c.ellipse(g.propX*w,g.propY*h,h*.014,h*(g.kind==='ball'?.014:.021),0,0,Math.PI*2);c.fill();c.strokeStyle='#fff2c9';c.lineWidth=2;c.stroke();if(g.kind==='balloon'){c.beginPath();c.moveTo(g.propX*w,g.propY*h+h*.021);c.quadraticCurveTo(g.propX*w-5,g.propY*h+h*.04,g.propX*w+4,g.propY*h+h*.055);c.stroke();}}
  if(g.kind==='race'){c.strokeStyle='#f5e5b5';c.lineWidth=2;c.beginPath();c.moveTo(g.target*w,y);c.lineTo(g.target*w,y-h*.09);c.stroke();for(let i=0;i<6;i++){c.fillStyle=i%2?'#243d4f':'#fff5cf';c.fillRect(g.target*w+(i%3)*5,y-h*.09+Math.floor(i/3)*5,5,5);}}
  if(g.kind==='hide')for(const p of g.players.slice(1)){c.fillStyle='#6d9e63';for(let i=0;i<4;i++){c.beginPath();c.ellipse(p.x*w+(i-1.5)*h*.014,y-h*.018,h*.023,h*.029,0,0,Math.PI*2);c.fill();}}
  if(g.kind==='treasure'){c.fillStyle='#e6bd64';c.fillRect(g.target*w-10,y-15,20,14);c.strokeStyle='#8a6645';c.strokeRect(g.target*w-10,y-15,20,14);c.fillStyle='#fff3a5';c.fillRect(g.target*w-2,y-10,4,4);}
 }
}
