import {drawIllnessPet} from './illness-renderer.js?v=illness47';
import {personalEmoteTime} from './pet-emote-time.js?v=illness47';
import {potionNameplate,drawPotionBadge,drawHealing} from './potion-badge.js?v=illness47';
import {drawUnicornTent} from './unicorn-care.js?v=illness47';
import {controls,adjustedMetrics,keyOf} from './control-state.js?v=illness47';
import {createCommandRunner,pollControls} from './control-events.js?v=illness47';
import {installBoardTeacher} from './board-teacher.js?v=illness47';
import {frameSteps,renderSize,petFilter} from './render-budget.js?v=illness47';
import {stableArtwork,stableFrame} from './stable-artwork.js?v=illness47';
import {drawSpeech} from './friendships.js?v=illness47';
import {installFriendships} from './friendship-panel.js?v=illness47';
import {conditionVisual,drawHealth,loadConditionArt} from './health.js?v=illness47';
import {installSavedRewards} from './saved-rewards.js?v=illness47';
import {hydrationChoice} from './hydration.js?v=illness47';
import {installSharingChoice} from './sharing-choice.js?v=illness47';
import {reconcilePets} from './roster-state.js?v=illness47';
import {boardActions,resolveAction,visibleFeeling,selectPetAction} from './pet-animation.js?v=illness47';
import {stepBoard} from './simulation.js?v=illness47';
import {createHosts,loadNpcArt} from './npc-animation.js?v=illness47';
import {createFlyer,drawFlyer,drawToys} from './flyer.js?v=illness47';
import {createCounter,loadCounterArt,counterArtReady,drawCounter} from './counter.js?v=illness47';
import {createWash} from './wash.js?v=illness47';
import {displayMetrics,framePlacement,artworkDirection} from './display.js?v=click48';
import {createCompanions,withResidents} from './companions.js?v=illness47';
import {isClassPet} from './profile.js?v=illness47';
import {drawGames} from './games.js?v=illness47';
import {createWorld,drawWorldGround,drawWorldAtmosphere,worldModes} from './world.js?v=illness47';
import {chooseItem} from './sharing.js?v=illness47';
import {loadEmotes,drawFeeling,feelingFallback} from './emotes.js?v=illness47';
import {stairs,floor,makePet,petFloor,frameIndex,hasAction,animationDuration,foodRemaining} from './motion.js?v=illness47';
import {favoriteFood} from './food.js?v=illness47';
import {drawLandscape,drawWash} from './scenery.js?v=illness47';
import {refreshRoster} from './connection.js?v=illness47';
import {drawFoundling,foundlingNameplate} from './foundling.js?v=illness47';
import {readBackup} from './backups.js?v=illness47';
const API='https://cyber-pet-classroom-settings.ragingaxolotl.chatgpt.site';
const medalHoverAreas=[];let medalPointer=null;
const $=id=>document.getElementById(id),canvas=$('world'),ctx=canvas.getContext('2d');
let pets=[],loaded=[],paused=matchMedia('(prefers-reduced-motion: reduce)').matches,previous=0,elapsed=0,animationRequest=null;
const friendships=installFriendships(()=>pets);
const livingWorld=createWorld(),washHistory=createWash();
let companions=[];
const counter=createCounter(),counterArt=loadCounterArt(),hosts=createHosts(),flyer=createFlyer();
const simulation={counter,hosts,flyer,livingWorld,washHistory};
let commandStorage;try{commandStorage=sessionStorage;}catch{}
const commandRunner=createCommandRunner(commandStorage),teacher=installBoardTeacher(canvas,()=>pets);
pollControls().catch(()=>{});setInterval(()=>pollControls().catch(()=>{}),15000);
loadNpcArt(hosts).catch(()=>{});

let width=1600,height=850,mode='class',busy=false;
const artworkBounds=new WeakMap(),foodImages=new Map();
const landscape=document.createElement('canvas');let landscapeDirty=true,showNames=true,foods=[];
loadEmotes().catch(()=>{});loadConditionArt().catch(()=>{});
const foodReady=fetch('assets/foods.json').then(r=>{if(!r.ok)throw Error('Food catalog is unavailable.');return r.json();}).then(data=>{foods=data;}).catch(()=>{$('caption').textContent='Food catalog unavailable; wandering and cloud wash remain available.';});
function measureArtwork(image){
  if(artworkBounds.has(image))return artworkBounds.get(image);
  const surface=document.createElement('canvas');surface.width=image.width;surface.height=image.height;
  const painter=surface.getContext('2d',{willReadFrequently:true});painter.drawImage(image,0,0);
  const pixels=painter.getImageData(0,0,image.width,image.height).data;let left=image.width,right=-1,top=image.height,bottom=-1;
  for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++)if(pixels[(y*image.width+x)*4+3]>16){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  const bounds=right<0?{x:0,y:0,w:image.width,h:image.height,empty:true}:{x:left,y:top,w:right-left+1,h:bottom-top+1};
  artworkBounds.set(image,bounds);surface.width=surface.height=1;return bounds;
}
const backdrop=new Image();backdrop.src='assets/location.png';
let resizePending=true;
function requestResize(){resizePending=true;}
function resize(){
  resizePending=false;
  const box=canvas.getBoundingClientRect(),w=Math.max(1,box.width),h=Math.max(1,box.height);
  const target=renderSize(w,h,devicePixelRatio||1);
  if(width===w&&height===h&&canvas.width===target.width&&canvas.height===target.height)return;
  width=w;height=h;
  if(canvas.width!==target.width)canvas.width=target.width;
  if(canvas.height!==target.height)canvas.height=target.height;
  ctx.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);
  if(landscape.width!==canvas.width)landscape.width=canvas.width;
  if(landscape.height!==canvas.height)landscape.height=canvas.height;
  landscapeDirty=true;
}
backdrop.onload=()=>{landscapeDirty=true;};
new ResizeObserver(requestResize).observe(canvas);
canvas.addEventListener('contextrestored',()=>{ctx.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);landscapeDirty=true;requestResize();});
function roundRect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
function stage(){
  if(landscapeDirty){const painter=landscape.getContext('2d');painter.setTransform(landscape.width/width,0,0,landscape.height/height,0,0);drawLandscape(painter,width,height,backdrop);landscapeDirty=false;}
  ctx.drawImage(landscape,0,0,width,height);drawWorldGround(ctx,width,height,livingWorld);
}
const dirtLayer=document.createElement('canvas');dirtLayer.width=dirtLayer.height=192;
const dirtPainter=dirtLayer.getContext('2d');
function drawDirt(img,bounds,x,y,w,h,direction,amount,pattern){
  if(amount<.005)return;
  const d=dirtPainter;d.clearRect(0,0,192,192);d.globalCompositeOperation='source-over';
  for(const [i,spot] of pattern.entries()){
    d.fillStyle=spot.shade;d.globalAlpha=Math.max(0,Math.min(.85,(amount-i*.012)*2));
    d.beginPath();d.ellipse(spot.x,spot.y,spot.rx,spot.ry,spot.angle,0,Math.PI*2);d.fill();
  }
  d.globalAlpha=1;d.globalCompositeOperation='destination-in';
  d.drawImage(img,bounds.x,bounds.y,bounds.w,bounds.h,0,0,192,192);
  d.globalCompositeOperation='source-over';
  ctx.save();ctx.translate(x,y);ctx.scale(direction,1);ctx.drawImage(dirtLayer,-w/2,-h,w,h);ctx.restore();
}
function updateMedalHover(){
  canvas.title=medalPointer&&medalHoverAreas.some(r=>medalPointer.x>=r.x&&medalPointer.x<=r.x+r.w&&medalPointer.y>=r.y&&medalPointer.y<=r.y+r.h)?'founding ribbon for starting the world':'';
}
canvas.addEventListener('pointermove',event=>{const box=canvas.getBoundingClientRect();medalPointer={x:(event.clientX-box.left)*width/box.width,y:(event.clientY-box.top)*height/box.height};updateMedalHover();});
canvas.addEventListener('pointerleave',()=>{medalPointer=null;updateMedalHover();});
function petSize(data){return adjustedMetrics(data,displayMetrics(data,width,height,pets.length),height);}
// Use the same visible artwork bounds as teacher selection, including floor offsets.
const namePopup=$('pet-name-popup');let namePopupTimer;
canvas.addEventListener('click',event=>{
  clearTimeout(namePopupTimer);
  const box=canvas.getBoundingClientRect(),x=event.clientX-box.left,y=event.clientY-box.top;
  const hit=[...teacher.areas].reverse().find(area=>x>=area.x&&x<=area.x+area.w&&y>=area.y&&y<=area.y+area.h);
  const pet=hit&&pets.find(p=>keyOf(p)===hit.id);
  namePopup.hidden=!pet;if(!pet)return;
  namePopup.querySelector('span').textContent=pet.data.name||'Cyber Pet';
  const icon=namePopup.querySelector('canvas'),paint=icon.getContext('2d');paint.clearRect(0,0,48,48);
  const action=resolveAction(pet.data,'idle'),image=pet.data.images.get(pet.data.config.animations[action]?.[0]);
  if(image){const bounds=measureArtwork(image),scale=40/Math.max(bounds.w,bounds.h);paint.imageSmoothingEnabled=false;paint.drawImage(image,bounds.x,bounds.y,bounds.w,bounds.h,(48-bounds.w*scale)/2,(48-bounds.h*scale)/2,bounds.w*scale,bounds.h*scale);}
  namePopup.style.left='8px';namePopup.style.top='8px';
  namePopup.style.left=Math.max(8,Math.min(box.width-namePopup.offsetWidth-8,x-namePopup.offsetWidth/2))+'px';
  namePopup.style.top=Math.max(8,Math.min(box.height-namePopup.offsetHeight-8,hit.y-namePopup.offsetHeight-10))+'px';
  namePopupTimer=setTimeout(()=>{namePopup.hidden=true;},4500);
});
function drawPet(pet){
  const data=pet.data,x=pet.x*width,groundY=(petFloor(pet)-(pet.worldBob||0))*height;
  let metrics=petSize(data);const preview=teacher.layout(pet);if(preview){const base=displayMetrics(data,width,height,pets.length);metrics={...base,scale:base.scale*preview.scale,desired:base.desired*preview.scale,offsetY:base.offsetY+preview.offset*height/720};}const y=groundY+metrics.offsetY;
  const action=pet.renderAction||selectPetAction(pet)||resolveAction(data,'idle');
  const animationClock=['eat','eat_side','jump','jump_side','play_side'].includes(action)?(pet.renderClock||0)%animationDuration(data.config,action):(pet.renderClock||0);
  const frames=data.config.animations[action],name=frames?.[frameIndex(data.config,action,animationClock)],img=data.images.get(name)||data.images.get(data.config.animations[resolveAction(data,'idle')]?.[0]);
  if(!img)return;
  const maxHeight=data.maxHeight,maxWidth=data.maxWidth,bounds=artworkBounds.get(img);
  const size=metrics,desired=size.desired*(pet.mode==='shelter'?(pet.shelterScale||1):1),scale=size.scale*(pet.mode==='shelter'?(pet.shelterScale||1):1);
  const facing=artworkDirection(data.config,action,pet.direction);
  const placement=framePlacement(stableFrame(data,action,name,bounds,img),data.artworkEnvelope,scale),w=placement.w,h=placement.h;
  teacher.areas.push({id:keyOf(pet),x:x+facing*placement.x-(facing<0?w:0),y:y+placement.y,w,h});
  if(teacher.selected(pet)){ctx.save();ctx.shadowColor='#9affdd';ctx.shadowBlur=24;ctx.strokeStyle='#bcffe5';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(x-w/2-7,y+placement.y-7,w+14,h+14,12);ctx.stroke();ctx.restore();}
  ctx.fillStyle='#172b4a36';ctx.beginPath();ctx.ellipse(x,groundY+1,Math.min(w*.32,desired*.5),4,0,0,Math.PI*2);ctx.fill();
  const healthVisual=conditionVisual(pet,elapsed,matchMedia('(prefers-reduced-motion: reduce)').matches);
  drawIllnessPet(ctx,pet,{img,bounds,originX:x,originY:y,x:placement.x,y:placement.y,w,h,facing,screenX:x+facing*placement.x-(facing<0?w:0),screenY:y+placement.y,screenWidth:w,screenHeight:h},elapsed,matchMedia('(prefers-reduced-motion: reduce)').matches,petFilter(data.tint||0,healthVisual.gray),healthVisual.alpha);
  const unit=Math.max(.65,Math.min(width/1280,height/595));
  const font=Math.max(8,Math.min(15*unit,desired*.25));ctx.font=`600 ${font}px system-ui`;ctx.textAlign='center';
  if(showNames){
    const label=data.name.length>16?data.name.slice(0,15)+'…':data.name;
    const plate=potionNameplate(foundlingNameplate(data.config.creation_record,ctx.measureText(label).width,font,unit),pet,font,unit);
    roundRect(x-plate.width/2,y+10*unit,plate.width,font+7*unit,4*unit,'#172a43df');ctx.fillStyle='#f5f0e5';ctx.fillText(label,x+plate.labelOffset,y+font+11*unit);
    drawPotionBadge(ctx,x+plate.potionCenterOffset,y+10*unit+(font+7*unit-plate.potionSize)/2,plate.potionSize);
    if(plate.medalWidth>0)medalHoverAreas.push({x:x+plate.medalCenterOffset-plate.medalWidth/2,y:y+10*unit+plate.medalTop,w:plate.medalWidth,h:plate.medalHeight});
    drawFoundling(ctx,data.config.creation_record,x+plate.medalCenterOffset,y+10*unit+plate.medalTop,plate.medalWidth,elapsed,matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  if(!pet.awaitingCounter&&['eat','snack'].includes(pet.mode)&&data.food){
    const meal=pet.mode==='snack'?(pet.snackItem||pet.heldItem):data.food;
    const image=foodImages.get(meal.id),size=desired*.43*Math.sqrt(foodRemaining(pet)),fx=x+pet.direction*desired*.49;
    if(image?.complete&&image.naturalWidth)ctx.drawImage(image,fx-size/2,y-size,size,size);

  }
  const feeling=pet.teacherEmoteUntil>elapsed?pet.teacherEmote:visibleFeeling(pet);
  if(feeling && (pet.foodReactionTime>0||!['eat','snack'].includes(pet.mode))){
    const ey=y-desired-20*unit,size=38*unit;
    if(!drawFeeling(ctx,feeling,personalEmoteTime(pet,elapsed,matchMedia('(prefers-reduced-motion: reduce)').matches),x,ey,size)){ctx.font=`600 ${18*unit}px system-ui`;ctx.fillStyle='#344b66';ctx.fillText(feelingFallback[feeling]||'…',x,ey+6*unit);}

  }
  if(pet.displayItem){
    let image=foodImages.get(pet.displayItem.id);
    if(!image){image=new Image();image.src=pet.displayItem.sprite;foodImages.set(pet.displayItem.id,image);}
    const size=desired*.5;if(image.complete&&image.naturalWidth)ctx.drawImage(image,x-size/2,y-desired-65*unit-size/2,size,size);
  }
  ctx.save();ctx.globalAlpha=healthVisual.alpha;ctx.filter=petFilter(0,healthVisual.gray);
  drawDirt(img,bounds,x+facing*(placement.x+w/2),y+placement.y+h,w,h,facing,1-pet.cleanliness,pet.dirtPattern);ctx.restore();
  drawHealth(ctx,pet,x,groundY,desired);
  drawHealing(ctx,pet,x,y,desired);
  drawSpeech(ctx,pet,x,y-desired-44*unit,unit,width);

}
function render(time){
  if(resizePending)resize();
  const steps=frameSteps(previous?(time-previous)/1000:0);previous=time;
  if(!paused&&!document.hidden&&!document.querySelector('#sharing-choice[open]')){for(const dt of steps){elapsed+=dt;commandRunner.run(simulation,pets,elapsed);for(const p of pets)p.bodyWidth=p.data.maxWidth*petSize(p.data).scale/width;stepBoard(simulation,pets,dt,elapsed,width/height,counterArtReady(counterArt));friendships.tick(dt);}}
  medalHoverAreas.length=0;teacher.areas.length=0;
  stage();drawUnicornTent(ctx,width,height,flyer);drawCounter(ctx,width,height,counter,counterArt,foodImages,hosts,elapsed);drawToys(ctx,width,height,flyer,foodImages);for(const p of [...pets].sort((a,b)=>petFloor(a)-petFloor(b)))drawPet(p);drawFlyer(ctx,width,height,flyer,hosts.art,elapsed,foodImages);drawWash(ctx,width,height,pets,elapsed);drawGames(ctx,width,height,pets,elapsed);drawWorldAtmosphere(ctx,width,height,livingWorld,elapsed);
  updateMedalHover();
  animationRequest=requestAnimationFrame(render);
}
function setPets(data,label){
  data=data.filter(isClassPet);if(label==='class')data=withResidents(data,companions);
  for(const pet of data){pet.food??=chooseItem({data:pet,random:Math.random},foods);pet.boardLike=pet.food?.name;if(pet.food&&!foodImages.has(pet.food.id)){const image=new Image();image.src=pet.food.sprite;foodImages.set(pet.food.id,image);}const stable=stableArtwork(pet,measureArtwork);pet.stableFrames=stable.frames;pet.artworkEnvelope=stable.envelope;pet.maxHeight=pet.artworkEnvelope.bottom-pet.artworkEnvelope.top;pet.maxWidth=pet.artworkEnvelope.right-pet.artworkEnvelope.left;}
  const keep=new Set(data.flatMap(p=>[...p.images.values()]));
  for(const p of loaded)for(const image of p.images.values())if(!keep.has(image))image.close?.();
  loaded=data;pets=reconcilePets(data,pets);mode=label;friendships.hydrate();
  for(const p of pets)p.chooseHydration=()=>{
   const item=hydrationChoice(p,foods);if(!item){p.hydrationRetry=60;return;}
   p.data.food=item;p.hydrationMeal=true;p.speech='A refreshing snack after play!';
   if(!foodImages.has(item.id)){const image=new Image();image.src=item.sprite;foodImages.set(item.id,image);}
  };
  $('status').textContent=label==='sample'?'Sample pets':`${data.length} ${data.length===1?'pet':'pets'} together`;
  $('caption').textContent=label==='sample'?`${data.length} sample pets · Jungle kitchen + cloud wash`:`${data.length} Cyber Pets · ${data.filter(p=>!hasAction(p,'walking')).length} resting without movement art · Display only`;
  $('empty').hidden=data.length>0;
}
function pause(){paused=!paused;syncPause();}
function syncPause(){$('pause').textContent=paused?'Play':'Pause';$('pause').setAttribute('aria-pressed',String(paused));}
$('pause').onclick=pause;syncPause();
$('setup').onclick=()=>{$('connection').showModal();};
document.querySelector('.close').onclick=()=>$('connection').close();
let fullscreenBusy=false;
function syncDisplay(){
  const full=!!document.fullscreenElement;
  document.body.classList.remove('board-mode');
  $('fullscreen').textContent=full?'Exit full screen':'Full screen ↗';
  $('fullscreen').setAttribute('aria-pressed',String(full));
  requestResize();
}
async function toggleFullscreen(){
  if(fullscreenBusy)return;fullscreenBusy=true;
  try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
  catch{$('caption').textContent='Use your browser’s full-screen command to fill the board.';}
  finally{fullscreenBusy=false;syncDisplay();}
}
$('fullscreen').onclick=toggleFullscreen;$('exit-fullscreen').onclick=toggleFullscreen;
document.addEventListener('fullscreenchange',syncDisplay);
document.addEventListener('fullscreenerror',syncDisplay);
window.addEventListener('resize',syncDisplay);
window.visualViewport?.addEventListener('resize',syncDisplay);
window.addEventListener('pagehide',()=>{cancelAnimationFrame(animationRequest);animationRequest=null;previous=0;});
window.addEventListener('pageshow',event=>{syncDisplay();if(animationRequest===null)animationRequest=requestAnimationFrame(render);if(event.persisted)refreshClass();});
document.addEventListener('keydown',event=>{if($('connection').open)return;if(event.code==='Space'){event.preventDefault();pause();}});
document.addEventListener('visibilitychange',()=>{previous=0;if(!document.hidden)syncDisplay();});
function loading(value){busy=value;document.querySelector('.primary').disabled=value;$('files').disabled=value;}
async function request(path){
  if(!/^\/board-api\/public(?:\/[a-f0-9]{64})?$/.test(path))throw Error('Unexpected classroom response.');
  const result=await fetch(API+path,{cache:'no-store',signal:AbortSignal.timeout(45000)});
  if(!result.ok){let message='Classroom could not be loaded.';try{message=(await result.json()).error||message;}catch{}throw Error(message);}return result;
}
async function loadMany(items,read,label){
  displayGeneration++;
  await foodReady;
  const next=[],failures=[];let pixelTotal=0;
  for(let i=0;i<items.length;i++){
    $('message').textContent=`Loading pet ${i+1} of ${items.length}…`;
    try{const pet=await read(items[i]);if(pixelTotal+(pet.pixels||0)>100000000){for(const img of pet.images.values())img.close?.();throw Error('Board memory limit reached. Load fewer or smaller pets.');}pixelTotal+=pet.pixels||0;next.push(pet);}
    catch(error){failures.push(`${items[i].name||'Pet '+(i+1)}: ${error.message}`);}
  }
  if(next.length||!items.length)setPets(next,label);
  if(failures.length){$('message').textContent=`Loaded ${next.length} of ${items.length}. ${failures.join(' • ')}`;$('caption').textContent=`${next.length} pets loaded · ${failures.length} could not load — see Load class`;}else{$('connection').close();$('message').textContent='';}
}
let autoEnabled=true;
async function refreshClass(){
  if(busy||!autoEnabled)return;
  loading(true);displayGeneration++;
  try{
    await foodReady;
    const list=await(await request('/board-api/public')).json();
    if(!Array.isArray(list.pets))throw Error('Unexpected classroom response.');
    const result=await refreshRoster(list.pets.filter(isClassPet),loaded,async item=>readBackup(await(await request(item.path)).arrayBuffer()));
    setPets(result.pets,'class');
    $('message').textContent=result.failures.join(' • ');
    $('caption').textContent=`${pets.filter(p=>!p.data.isCompanion).length} class pets + ${companions.length} colorful companions · Auto-updates every minute${result.failures.length?' · Some updates unavailable — see Board settings':''}`;
  }catch(error){
    $('message').textContent=error.message;
    $('caption').textContent='Class connection unavailable · Keeping current pets · Retrying automatically';
  }finally{loading(false);}
}
$('refresh-class').onclick=async()=>{autoEnabled=true;await refreshClass();if(!$('message').textContent)$('connection').close();};
setInterval(()=>refreshClass(),60000);
window.addEventListener('online',()=>refreshClass());
$('files').onchange=async()=>{if(busy)return;const files=[...$('files').files];if(!files.length)return;autoEnabled=false;loading(true);try{await loadMany(files,async file=>{if(file.size>32*1024*1024)throw Error('Backup exceeds 32 MiB.');return readBackup(await file.arrayBuffer());},'local');}finally{$('files').value='';loading(false);}};
let displayGeneration=0;
$('names').onchange=()=>{showNames=$('names').checked;};
resize();animationRequest=requestAnimationFrame(render);syncDisplay();
async function startBoard(){
  try{
    const config=await(await fetch('assets/demo.json')).json(),images=new Map();
    for(const name of new Set(boardActions.flatMap(action=>config.animations[action]||[]))){const image=new Image();image.src='assets/'+name;await image.decode();images.set(name,image);}
    companions=createCompanions(config,images);await foodReady;setPets([],'class');
  }catch{$('message').textContent='Colorful companions could not load. Reload to retry.';}
  await refreshClass();
}
$('caption').textContent='Loading backed-up class pets automatically';startBoard();

const savedRewards=installSavedRewards(()=>pets);
installSharingChoice(()=>pets,pet=>savedRewards.sharing(pet));
