import {drawHostPair,hostX} from './host-interactions.js?v=23';
import {drawHost} from './npc-animation.js?v=23';
import {advanceCounterQueue} from './counter-queue.js?v=23';
// Original 4x4, 64px-cell atlases. Coordinates are zero-based; no repainted frames.
// Front -> three-quarter -> profile bridges the idle and tray clips in both directions.
export const frames={
  rest:['idle',0,0,32],breath:['idle',0,1,32],
  turn:['serving',1,0,29],profile:['idle',2,0,31],
  tray:['serving',0,0,28],reach:['serving',0,1,28],offer:['serving',0,2,29]
};
export const serviceClip=[['rest',.18],['turn',.16],['profile',.16],['tray',.24],['reach',.22],['offer',.55],['reach',.22],['tray',.24],['profile',.16],['turn',.16],['rest',.24]];
export const handoffAt=1.65;
export const serviceDuration=3.2;
export function createCounter(){return {clock:0,idleClock:0,customer:null};}
export function counterFrame(counter){
  if(!counter.customer){const t=counter.idleClock%7;return t>5.7&&t<6.3?'breath':'rest';}
  let t=counter.clock;
  for(const [name,duration] of serviceClip){if(t<duration)return name;t-=duration;}
  return 'rest';
}
export function advanceCounter(counter,pets,dt,ready=true){
  if(counter.managed){advanceCounterQueue(counter,pets,dt,ready,{handoffAt,serviceDuration});return;}
  const waiting=p=>p.mode==='eat'&&p.awaitingCounter&&p.level===1&&!p.stair;
  // Missing artwork must never strand hungry pets.
  if(!ready){for(const p of pets)if(p.awaitingCounter){p.awaitingCounter=false;p.clock=0;}counter.customer=null;return;}
  counter.idleClock+=dt;
  if(counter.customer&&(!pets.includes(counter.customer)||counter.customer.mode!=='eat')){counter.customer=null;counter.clock=0;}
  if(!counter.customer){counter.customer=pets.filter(waiting).sort((a,b)=>(b.counterWait||0)-(a.counterWait||0))[0]||null;counter.clock=0;}
  for(const p of pets)if(waiting(p))p.counterWait=(p.counterWait||0)+dt;
  if(!counter.customer)return;
  counter.clock+=dt;
  if(counter.clock>=handoffAt&&counter.customer.awaitingCounter){counter.customer.awaitingCounter=false;counter.customer.clock=0;counter.customer.counterWait=0;}
  if(counter.clock>=serviceDuration){counter.customer=null;counter.clock=0;counter.idleClock=0;}
}
export function loadCounterArt(){
  const art={};for(const name of ['idle','serving']){const img=new Image();img.src=`assets/attendant/${name}.png`;art[name]=img;}return art;
}
export const counterArtReady=art=>['idle','serving'].every(key=>art[key]?.complete&&art[key]?.naturalWidth===256);
export function drawCounter(c,w,h,counter,art,foodImages,hosts,elapsed=0){
  const x=w*.51,ground=h*.605,size=h*.117,top=ground-h*.122;
  const paired=drawHostPair(c,w,h,hosts,elapsed);
  const animated=paired||hosts&&drawHost(c,w,h,hosts.people[0],hosts.art.host1,hostX(0,w,h)/w,elapsed);
  const second=paired||hosts&&drawHost(c,w,h,hosts.people[1],hosts.art.host2,hostX(1,w,h)/w,elapsed);
  if(!animated&&!second&&counterArtReady(art)){
    const [sheet,row,col,pivot]=frames[counterFrame(counter)];
    c.save();c.imageSmoothingEnabled=false;
    c.drawImage(art[sheet],col*64,row*64,64,64,x-pivot/64*size,top,size,size);c.restore();
  }
  // Foreground counter masks the legs, leaving the authored upper-body motion visible.
  c.fillStyle='#805e3b';c.fillRect(w*.415,ground-h*.043,w*.19,h*.043);
  c.fillStyle='#b79b65';c.fillRect(w*.412,ground-h*.049,w*.196,h*.009);
  c.fillStyle='#d8bb82';c.fillRect(w*.412,ground-h*.049,w*.196,h*.003);
  for(let i=0;i<5;i++){c.fillStyle='#e9d9b4';c.beginPath();c.ellipse(w*(.45+i*.03),ground-h*.050,w*.009,h*.003,0,0,Math.PI*2);c.fill();}
  const pet=counter.customer,t=counter.clock;
  // Actual preferred food travels from the offered tray to the customer's plate.
  if(pet&&t>=1.10&&t<handoffAt){
    const image=foodImages.get(pet.data.food?.id),u=Math.max(0,Math.min(1,(t-1.10)/.55)),ease=u*u*(3-2*u);
    const sx=hostX(counter.servingHost??1,w,h)+size*.28,sy=top+size*.51,ex=pet.x*w,ey=ground-h*.055,s=h*.024;
    if(image?.complete&&image.naturalWidth)c.drawImage(image,sx+(ex-sx)*ease-s/2,sy+(ey-sy)*ease-Math.sin(u*Math.PI)*h*.018-s/2,s,s);
  }
}
