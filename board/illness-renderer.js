import {conditionKinds} from './condition-kinds.js?v=illness47';
import {drawMotif,motifIds} from './illness-motifs.js?v=illness47';
import {personalEmoteTime} from './pet-emote-time.js?v=illness47';
const aliases={infection_crystal_rash:'crystal_bloom',parasite_moss_crown:'mosswire',parasite_spore_fan:'sporefan',bitrot_patch:'bitrot',injury_bruise:'seam_bruise',fatigue_droplets:'muscle_fatigue',queasy_bubbles:'signal_churn',phase_drift:'phase_scarring',spooked:'echo_fright',overfull:'buffer_bloat'};
export function visualKind(c){return conditionKinds[c.specific_kind]?.family===c.family?c.specific_kind:conditionKinds[c.id]?c.id:aliases[c.id]||({digestive:'signal_churn',stress:'echo_fright',injury:'seam_bruise',fatigue:'muscle_fatigue',chronic:'bitrot',infection:'crystal_bloom',parasites:'mosswire'}[c.family]);}
const art=new Map(),sheets=new Map(),states=new WeakMap(),anchors=new WeakMap();
const TAU=Math.PI*2,frac=x=>x-Math.floor(x),clamp=x=>Math.max(0,Math.min(1,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const grain=(x,y)=>frac(Math.sin(x*127.1+y*311.7)*43758.5453);
const mix=(a,b,t)=>a+(b-a)*t;
function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y),a=smooth(0,1,frac(x)),b=smooth(0,1,frac(y));return mix(mix(grain(ix,iy),grain(ix+1,iy),a),mix(grain(ix,iy+1),grain(ix+1,iy+1),a),b);}
const surfaceIds=new Map([['bitrot',0],['seam_bruise',1],['trademark_101',2],['trademark_074',3],['trademark_065',4],['trademark_066',5]]);
export async function loadIllnessArt(){
 const ids=[...new Set(Object.values(conditionKinds).map(k=>k.asset)),'static_mite_single'];
 const animated=new Set(['glitch_fever','infection_crystal_rash','parasite_moss_crown','parasite_spore_fan','static_mites','queasy_bubbles','stress_tangle','pumpwire_leech_v2','memory_reedling_v2','coral_polyp_branch','static_mite_single']);
 await Promise.all(ids.flatMap(id=>[false,...(animated.has(id)?[true]:[])].map(async animated=>{const image=new Image();image.src=`assets/care/illness/${animated?'animated-':''}${id}.png`;try{await image.decode();(animated?sheets:art).set(id,image);}catch{/* Keep a still if an authored animation cannot load. */}})));
}
function stamp(g,id,x,y,w,t,still=false,angle=0){
 const sheet=!still&&sheets.get(id),image=sheet||art.get(id);if(!image)return;
 const [fw,fh]=id==='static_mite_single'?[64,64]:id==='pumpwire_leech_v2'?[96,64]:id==='memory_reedling_v2'?[96,128]:[128,128];
 const sourceWidth=sheet?fw:image.naturalWidth,sourceHeight=sheet?fh:image.naturalHeight;
 const count=sheet?Math.max(1,Math.floor(image.naturalWidth/fw)):1,index=sheet?Math.floor(Math.max(0,t)*(id==='static_mite_single'?8:6))%count:0;
 g.save();g.translate(x,y);g.rotate(angle);g.imageSmoothingEnabled=false;g.drawImage(image,index*sourceWidth,0,sourceWidth,sourceHeight,-w/2,-w*sourceHeight/sourceWidth/2,w,w*sourceHeight/sourceWidth);g.restore();
}
function bodyPoints(frame){
 let points=anchors.get(frame.img);if(points)return points;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const g=canvas.getContext('2d',{willReadFrequently:true}),b=frame.bounds;g.drawImage(frame.img,b.x,b.y,b.w,b.h,0,0,64,64);
 const data=g.getImageData(0,0,64,64).data;points=[];for(let y=1;y<63;y++)for(let x=1;x<63;x++)if(data[(y*64+x)*4+3]>180)points.push([x/64*192,y/64*192]);
 anchors.set(frame.img,points);return points;
}
function anchor(frame,x,y){const points=bodyPoints(frame);let best=null,distance=Infinity;for(const p of points){const d=(p[0]-x)**2+(p[1]-y)**2;if(d<distance){distance=d;best=p;}}return best;}
function sampleFrame(g,frame,x=0,y=0,w=192,h=192,region={x:0,y:0,w:1,h:1}){
 const b=frame.bounds;g.drawImage(frame.img,b.x+b.w*region.x,b.y+b.h*region.y,b.w*region.w,b.h*region.h,x,y,w,h);
}
function prepare(p,frame,seconds,still){
 let s=states.get(p);if(!s){s={history:[],started:new Map(),layers:new Map(),steps:[],last:null,stride:0,foot:0};states.set(p,s);}
 const ids=new Set((p.health?.conditions||[]).map(visualKind));
 for(const id of s.started.keys())if(!ids.has(id)){s.started.delete(id);s.layers.delete(id);}
 for(const id of ids)if(!s.started.has(id))s.started.set(id,seconds);
 s.now=seconds;s.time=still?1.6:personalEmoteTime(p,seconds);s.still=still;
 if(s.history.length&&seconds<s.history.at(-1).time)s.history=[];
 if(!s.history.length||seconds-s.history.at(-1).time>=1/15){s.history.push({...frame,time:seconds});if(s.history.length>76)s.history.shift();}
 const feet={x:frame.screenX+frame.screenWidth*.5,y:frame.screenY+frame.screenHeight*.85,time:seconds};
 const distance=s.last?Math.hypot(feet.x-s.last.x,feet.y-s.last.y):0,dt=s.last?seconds-s.last.time:0,stride=Math.max(2,frame.screenWidth*14/192);
 if(still||!ids.has('trademark_063')||!s.last||dt<0||dt>.5||distance>frame.screenWidth*.75){s.steps=[];s.stride=0;}
 else if(distance>.001){let next=stride-s.stride;while(next<=distance){s.steps.push({x:mix(s.last.x,feet.x,next/distance),y:mix(s.last.y,feet.y,next/distance),time:seconds,side:s.foot++%2?1:-1});next+=stride;}s.stride=(s.stride+distance)%stride;}
 s.steps=s.steps.filter(step=>seconds-step.time<3.8).slice(-24);s.last=feet;return s;
}
function drawBody(g,p,frame,s){
 const ids=new Set((p.health?.conditions||[]).map(visualKind));sampleFrame(g,frame);
 // These effects replace regions of the real pet, never a generic symptom icon.
 if(ids.has('trademark_041')){for(let i=0;i<4;i++){const old=s.still?frame:s.history.findLast(h=>h.time<=s.now-(i+1)*.55)||s.history[0];g.clearRect(0,35+i*32,192,12);sampleFrame(g,old,0,35+i*32,192,12,{x:0,y:(35+i*32)/192,w:1,h:12/192});}}
 if(ids.has('trademark_058')){g.save();g.globalCompositeOperation='destination-out';for(let i=0;i<5;i++){const point=anchor(frame,i%2?190:2,35+i*27);if(point)g.fillRect(point[0]-4,point[1],8,9+Math.sin(s.time*.4+i)*3);}g.restore();}
 if(ids.has('trademark_062')){for(let i=0;i<5;i++){const x=35+i%3*38,y=40+Math.floor(i/3)*58,phase=.5+.5*Math.sin(s.time*.5+i),offset=(1-smooth(.3,.8,phase))*17;g.clearRect(x,y,24,32);sampleFrame(g,frame,x,y,24,32,{x:(x+offset)/192,y:(y+offset*.4)/192,w:24/192,h:32/192});}}
 if(ids.has('trademark_095')){for(let i=0;i<4;i++){const y=110+i*18,dx=(i%2?1:-1)*(3+Math.sin(s.time*.6+i)*1.5);g.clearRect(0,y,192,18);sampleFrame(g,frame,dx,y,192,18,{x:0,y:y/192,w:1,h:18/192});}}
}
function surface(s,id,severity){
 const tick=Math.floor(s.time*8),age=s.still?45:Math.max(0,s.now-s.started.get(id)),spread=clamp(age/75),mode=surfaceIds.get(id),key=`${tick}/${severity}/${Math.floor(age*8)}`;
 let cached=s.layers.get(id);if(cached?.key===key)return cached.canvas;
 const canvas=cached?.canvas||document.createElement('canvas');canvas.width=canvas.height=96;const g=canvas.getContext('2d'),image=g.createImageData(96,96),data=image.data,t=s.time;
 for(let y=0;y<96;y++)for(let x=0;x<96;x++){
  const u=x/96,v=y/96,m=noise(u*35,v*35);let a=0,c=[70,30,90];
  if(mode===0){const d=Math.min(Math.hypot(u-.38,(v-.56)*.85),Math.hypot((u-.64)*.85,v-.71)+.025,Math.hypot(u-.55,(v-.33)*1.2)+.06),edge=d+noise(u*19,v*19)*.055+m*.018,r=.035+spread*.19+severity*.012;a=(1-smooth(r-.008,r+.008,edge))*(.3+.39*m);c=[mix(56,199,m),mix(19,84,m),mix(6,22,m)];}
  else if(mode===1){const d=Math.hypot((u-.42)/.2,(v-.67)/.135),f=1-smooth(.24,.99,d+(m-.5)*.24),rim=smooth(.28,.88,d);a=f*(.19+severity*.055)*(.78+.22*m);c=[mix(71,117,rim),mix(31,82,rim),mix(97,66,rim)];}
  else if(mode===2){const field=Math.hypot((u-.43)*1.1,(v-.55)*.8)+.016*Math.sin(v*35)+.012*Math.sin(u*28)+.003*Math.sin(t*.22+v*8),contour=1-smooth(.03,.1,Math.abs(frac(field*30)-.5)),growth=1-smooth(.1+spread*.3,.13+spread*.3,field),leaf=(1-smooth(.12,.25,Math.hypot(frac(u*15)-.5,(frac(v*12)-.5)*1.8)))*(noise(Math.floor(u*15)*3,Math.floor(v*12)*3)>.55?1:0);a=Math.max(contour*.62,leaf*.75)*growth;c=[mix(31,150,leaf),mix(102,214,leaf),mix(59,79,leaf)];}
  else if(mode===3){for(let i=0;i<3;i++){const dx=(u-(.35+i*.15))/.08,dy=(v-(.44+i%2*.19))/.12,open=.2+.7*(.5+.5*Math.sin(t*.8+i*2.1));if(Math.abs(dx)<open&&Math.abs(dy)<1){const border=Math.abs(dx)>open-.11||Math.abs(dy)>.88,hue=[[235,148,51],[77,194,242],[201,82,196]][i],pattern=frac((dx+dy)*3+i*.25)>.5?1:.3;c=border?[235,217,145]:hue.map(n=>n*pattern);a=border?.88:.64;}}}
  else if(mode===4){for(let i=0;i<4;i++){const zig=.3+i*.115+.032*Math.sin(v*42+i*2)+.012*Math.sin(v*91),line=(1-smooth(.002,.008,Math.abs(u-zig)))*smooth(.25,.36,v)*(1-smooth(.72,.81,v)),pulse=Math.pow(.5+.5*Math.sin(t*1.6-v*7+i*1.3),3);a=Math.max(a,line*(.22+.67*pulse));}c=[mix(97,212,a),mix(102,245,a),mix(212,255,a)];}
  else {const mask=1-smooth(.65,1.05,Math.hypot((u-.5)/.29,(v-.64)/.16)),tx=frac(u*27+Math.floor(v*22)%2*.5),ty=frac(v*22),seam=1-smooth(.025,.12,Math.min(tx,1-tx,ty,1-ty)),scrape=grain(Math.floor(u*160),Math.floor(v*160))>.78?1:0;a=mask*(seam*.28+scrape*.32)*(.65+severity*.13);c=[mix(97,219,scrape),mix(51,148,scrape),mix(46,107,scrape)];}
  const n=(y*96+x)*4;data[n]=c[0];data[n+1]=c[1];data[n+2]=c[2];data[n+3]=a*255;
 }
 g.putImageData(image,0,0);s.layers.set(id,{key,canvas});return canvas;
}
function clippedSurface(g,frame,s,id,severity){
 const texture=surface(s,id,severity);const layer=s.mask??=document.createElement('canvas');layer.width=layer.height=192;const painter=layer.getContext('2d');painter.imageSmoothingEnabled=false;painter.drawImage(texture,0,0,192,192);painter.globalCompositeOperation='destination-in';sampleFrame(painter,frame);painter.globalCompositeOperation='source-over';g.drawImage(layer,0,0);
}
function effects(g,p,frame,s){
 const drawFrame=(f,x,y,w,h,region)=>{g.save();if(f.facing!==frame.facing){g.translate(x*2+w,0);g.scale(-1,1);}sampleFrame(g,f,x,y,w,h,region);g.restore();};
 for(const c of p.health?.conditions||[]){const id=visualKind(c),kind=conditionKinds[id],v=c.severity,t=s.time,still=s.still,width=v<=1?32:v<=2?44:52;
  g.save();
  if(surfaceIds.has(id)){clippedSurface(g,frame,s,id,v);}
  else if(motifIds.has(id)){drawMotif(g,id,t,v,s,frame,drawFrame,still);}
  else if(['trademark_041','trademark_058','trademark_062','trademark_095'].includes(id)){}
  else if(id==='static_mites'){
   for(let i=0;i<2+Math.floor(v)*2;i++){const phase=still?i*.73:t*(.15+i*.013)+i*.73,point=anchor(frame,96+Math.cos(phase)*55,105+Math.sin(phase*.83+i)*51);if(point)stamp(g,'static_mite_single',...point,18,t+i*.137,still,Math.atan2(Math.cos(phase*.83+i)*.83,-Math.sin(phase)));}
  }else if(id==='trademark_007'){
   const point=anchor(frame,45,111);if(point){g.strokeStyle='#e6cda7';g.lineWidth=3;g.beginPath();g.ellipse(point[0],point[1],6,4,0,0,TAU);g.stroke();}
  }else if(id==='trademark_025'||id==='trademark_030'){
   const count=id==='trademark_025'?1:3,growth=still?1:.35+.65*clamp((s.now-s.started.get(id))/45);
   for(let i=0;i<count;i++){const point=anchor(frame,id==='trademark_025'?65:65+i*31,id==='trademark_025'?62:83+i%2*40);if(!point)continue;stamp(g,kind.asset,point[0],point[1]-width*.3,width*(id==='trademark_030'?growth:1.25),t+i*.27,still);
    for(let j=0;j<3;j++){const phase=frac(t/5+i*.19+j*.31);g.save();g.globalAlpha*=Math.sin(phase*Math.PI)*.7;g.fillStyle=id==='trademark_025'?'#bdfab5':'#f2b5c4';g.translate(point[0]+(j-1)*phase*20,point[1]-phase*28);g.rotate(id==='trademark_030'?t*.7+i+j:0);g.fillRect(-1.5,-2,3,4);g.restore();}}
  }else if(id==='phase_scarring'){
   for(let i=0;i<3;i++){const phase=frac(t/6+i*.27),angle=-Math.PI*.7+i*.7;g.save();g.globalAlpha*=Math.sin(phase*Math.PI)*.18;sampleFrame(g,frame,Math.cos(angle)*phase*35,Math.sin(angle)*phase*22);g.restore();}
  }else if(id==='crystal_bloom'){
   for(let i=0;i<2+v;i++){const point=anchor(frame,55+i*23,75+i%2*50);if(point)stamp(g,kind.asset,...point,width*.7,t+i*.3,still);}
  }else if(id==='mosswire'||id==='sporefan'){
   const point=anchor(frame,96,0);if(point)stamp(g,kind.asset,point[0],point[1]+7,width*1.3,t,still);
  }else if(id==='glitch_fever'){
   for(let i=0;i<2;i++){const phase=frac(t/4+i*.5);g.save();g.globalAlpha*=Math.sin(phase*Math.PI)*.85;stamp(g,kind.asset,65+i*58,45-phase*24,width,t+i,still);g.restore();}
  }else if(kind){stamp(g,kind.asset,174,105,width,t,still);}
  g.restore();
 }
}
// One frame is shared by body, history and attachments, including horizontal flips.
export function drawIllnessPet(ctx,p,frame,seconds,still,filter='none',alpha=1){
 const active=!!p.health?.conditions.length;
 ctx.save();ctx.translate(frame.originX,frame.originY);ctx.scale(frame.facing,1);ctx.translate(frame.x,frame.y);ctx.scale(frame.w/192,frame.h/192);ctx.imageSmoothingEnabled=false;
 const s=active?prepare(p,frame,seconds,still):null;
 if(s&&(p.health?.conditions||[]).some(c=>visualKind(c)==='trademark_007')){const point=anchor(frame,45,111);if(point)stamp(ctx,'pumpwire_leech_v2',point[0]-38,point[1]+3,96,s.time,still);}
 ctx.save();ctx.filter=filter;ctx.globalAlpha*=alpha;
 if(s){const body=s.body??=document.createElement('canvas');body.width=body.height=192;const painter=body.getContext('2d');painter.imageSmoothingEnabled=false;drawBody(painter,p,frame,s);ctx.drawImage(body,0,0);}else{states.delete(p);sampleFrame(ctx,frame);}
 ctx.restore();if(s)effects(ctx,p,frame,s);ctx.restore();
}
export const illnessRendererCoverage=Object.keys(conditionKinds);
