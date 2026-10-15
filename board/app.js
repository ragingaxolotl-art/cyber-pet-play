import {randomLike} from './group.js?v=6';
import {loadEmotes,drawFeeling,feelingFallback} from './emotes.js?v=6';
import {stairs,floor,makePet,tick,petFloor,frameIndex,hasAction,animationDuration,interactPets,foodRemaining,advanceTag} from './motion.js?v=6';
import {favoriteFood} from './food.js?v=6';
import {drawLandscape,drawWash} from './scenery.js?v=6';
import {readConnection,rememberConnection,forgetConnection,refreshRoster} from './connection.js?v=6';
import {readBackup} from './backups.js?v=6';
const API='https://cyber-pet-classroom-settings.ragingaxolotl.chatgpt.site';
const $=id=>document.getElementById(id),canvas=$('world'),ctx=canvas.getContext('2d');
let pets=[],loaded=[],paused=matchMedia('(prefers-reduced-motion: reduce)').matches,previous=0,elapsed=0;
let sessionLikes=new Map();
let width=1600,height=850,mode='sample',busy=false;
const artworkBounds=new WeakMap(),foodImages=new Map();
const landscape=document.createElement('canvas');let landscapeDirty=true,showNames=true,foods=[];
loadEmotes().catch(()=>{});
const foodReady=fetch('assets/foods.json').then(r=>{if(!r.ok)throw Error('Food catalog is unavailable.');return r.json();}).then(data=>{foods=data;}).catch(()=>{$('caption').textContent='Food catalog unavailable; wandering and cloud wash remain available.';});
function measureArtwork(image){
  if(artworkBounds.has(image))return artworkBounds.get(image);
  const surface=document.createElement('canvas');surface.width=image.width;surface.height=image.height;
  const painter=surface.getContext('2d',{willReadFrequently:true});painter.drawImage(image,0,0);
  const pixels=painter.getImageData(0,0,image.width,image.height).data;let left=image.width,right=-1,top=image.height,bottom=-1;
  for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++)if(pixels[(y*image.width+x)*4+3]>16){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  const bounds=right<0?{x:0,y:0,w:image.width,h:image.height}:{x:left,y:top,w:right-left+1,h:bottom-top+1};
  artworkBounds.set(image,bounds);surface.width=surface.height=1;return bounds;
}
const backdrop=new Image();backdrop.src='assets/location.png';
function resize(){
  const box=canvas.getBoundingClientRect();width=box.width;height=box.height;
  // Native pixels up to a 4K pixel budget, including high-DPI laptop mirroring.
  const ratio=Math.min(devicePixelRatio||1,Math.sqrt(3840*2160/Math.max(1,width*height)));
  canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
  landscape.width=canvas.width;landscape.height=canvas.height;landscapeDirty=true;
}
backdrop.onload=()=>{landscapeDirty=true;};
new ResizeObserver(resize).observe(canvas);
function roundRect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
function stage(){
  if(landscapeDirty){const painter=landscape.getContext('2d');painter.setTransform(landscape.width/width,0,0,landscape.height/height,0,0);drawLandscape(painter,width,height,backdrop);landscapeDirty=false;}
  ctx.drawImage(landscape,0,0,width,height);
}
function drawPet(pet){
  const data=pet.data,x=pet.x*width,y=petFloor(pet)*height;
  let action=['walk','wash','tag'].includes(pet.mode)&&hasAction(data,'walking')?'walking':'idle';
  if(pet.emoteTime>0 && ['idle','social'].includes(pet.mode) && ['hearts','love','cute','laughing','eager','ok'].includes(pet.emote) && hasAction(data,'happy'))action='happy';
  if(pet.mode==='eat'&&hasAction(data,'eat'))action='eat';
  const animationClock=action==='eat'?pet.clock%animationDuration(data.config,'eat'):pet.clock;
  const frames=data.config.animations[action],name=frames?.[frameIndex(data.config,action,animationClock)],img=data.images.get(name)||data.images.get(data.config.animations.idle[0]);
  if(!img)return;
  const maxHeight=data.maxHeight,maxWidth=data.maxWidth,bounds=artworkBounds.get(img);
  const desired=Math.min(height*.115,Math.max(14,width/(Math.ceil(pets.length/3)+2)*.70));
  const scale=Math.min(desired/maxHeight,desired*1.6/maxWidth),w=bounds.w*scale,h=bounds.h*scale;
  ctx.fillStyle='#172b4a36';ctx.beginPath();ctx.ellipse(x,y+1,Math.min(w*.32,desired*.5),4,0,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.translate(x,y);ctx.scale(pet.direction,1);if(data.tint)ctx.filter=`hue-rotate(${data.tint}deg)`;ctx.imageSmoothingEnabled=false;ctx.drawImage(img,bounds.x,bounds.y,bounds.w,bounds.h,-w/2,-h,w,h);ctx.restore();
  const unit=Math.max(.65,Math.min(width/1280,height/595));
  const font=Math.max(8,Math.min(15*unit,desired*.25));ctx.font=`600 ${font}px system-ui`;ctx.textAlign='center';
  if(showNames){
    const label=data.name.length>16?data.name.slice(0,15)+'…':data.name,lw=ctx.measureText(label).width+12*unit;
    roundRect(x-lw/2,y+10*unit,lw,font+7*unit,4*unit,'#172a43df');ctx.fillStyle='#f5f0e5';ctx.fillText(label,x,y+font+11*unit);
  }
  if(pet.mode==='eat'&&data.food){
    const image=foodImages.get(data.food.id),size=desired*.43*Math.sqrt(foodRemaining(pet)),fx=x+pet.direction*desired*.49;
    if(image?.complete&&image.naturalWidth)ctx.drawImage(image,fx-size/2,y-size,size,size);
    ctx.font=`600 ${Math.max(9,font*.85)}px system-ui`;const label=data.food.name,tw=ctx.measureText(label).width+14*unit;
    roundRect(x-tw/2,y-desired-24*unit,tw,19*unit,6*unit,'#fff1c9');ctx.fillStyle='#3b523b';ctx.fillText(label,x,y-desired-11*unit);
  }
  if(pet.emoteTime>0 && pet.mode!=='eat'){
    const ey=y-desired-20*unit,size=38*unit;
    roundRect(x-size*.65,ey-size*.65,size*1.3,size*1.3,10*unit,'#fff4df','#d8c7a8');
    if(!drawFeeling(ctx,pet.emote,elapsed,x,ey,size)){ctx.font=`600 ${18*unit}px system-ui`;ctx.fillStyle='#344b66';ctx.fillText(feelingFallback[pet.emote]||'…',x,ey+6*unit);}

  }
  if(['social','tag'].includes(pet.mode)&&pet.speech){
    const text=pet.speech.length>32?pet.speech.slice(0,31)+'…':pet.speech;
    ctx.font=`600 ${Math.max(10,12*unit)}px system-ui`;const tw=ctx.measureText(text).width+16*unit;
    const sx=Math.max(tw/2+4,Math.min(width-tw/2-4,x)),sy=y-desired-65*unit;
    roundRect(sx-tw/2,sy,tw,24*unit,8*unit,'#fff8e9','#d8c7a8');ctx.fillStyle='#344b66';ctx.fillText(text,sx,sy+16*unit);
  }
  // Dirt flecks are a local display effect; the wash clears them for this session.
  if(pet.mode==='wash'){
    ctx.save();ctx.globalAlpha=(1-pet.cleanliness)*(1-pet.washProgress);ctx.fillStyle='#755b43';
    for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(x+Math.sin(i*2)*desired*.22,y-desired*(.2+i*.14),Math.max(1.5,desired*.025),0,Math.PI*2);ctx.fill();}ctx.restore();
  }

}
function render(time){
  const dt=previous?Math.min((time-previous)/1000,.05):0;previous=time;
  if(!paused&&!document.hidden){elapsed+=dt;for(const p of pets)tick(p,dt);advanceTag(pets,dt);interactPets(pets);}
  stage();for(const p of [...pets].sort((a,b)=>petFloor(a)-petFloor(b)))drawPet(p);drawWash(ctx,width,height,pets,elapsed);
  requestAnimationFrame(render);
}
function setPets(data,label){
  for(const pet of data){const key=pet.id;if(label==='sample'&&!sessionLikes.has(key))sessionLikes.set(key,randomLike(foods));pet.food=label==='sample'?sessionLikes.get(key):favoriteFood(foods,pet.foodPreferences);pet.boardLike=pet.food?.name;if(pet.food&&!foodImages.has(pet.food.id)){const image=new Image();image.src=pet.food.sprite;foodImages.set(pet.food.id,image);}const bounds=[...pet.images.values()].map(measureArtwork);pet.maxHeight=Math.max(...bounds.map(b=>b.h));pet.maxWidth=Math.max(...bounds.map(b=>b.w));}
  const keep=new Set(data.flatMap(p=>[...p.images.values()]));
  for(const p of loaded)for(const image of p.images.values())if(!keep.has(image))image.close?.();
  const existing=new Map(pets.map(p=>[p.data,p]));
  loaded=data;pets=data.map((pet,i)=>existing.get(pet)||makePet(pet,i,data.length));mode=label;
  $('status').textContent=label==='sample'?'Sample pets':`${data.length} ${data.length===1?'pet':'pets'} together`;
  $('caption').textContent=label==='sample'?`${data.length} sample pets · Jungle kitchen + cloud wash`:`${data.length} Cyber Pets · ${data.filter(p=>!hasAction(p,'walking')).length} resting without movement art · Display only`;
  $('empty').hidden=data.length>0;
}
function pause(){paused=!paused;syncPause();}
function syncPause(){$('pause').textContent=paused?'Play':'Pause';$('pause').setAttribute('aria-pressed',String(paused));}
$('pause').onclick=pause;syncPause();
$('setup').onclick=()=>{$('connection').showModal();$('password').focus();};
document.querySelector('.close').onclick=()=>$('connection').close();
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('caption').textContent='Use your browser’s full-screen command to fill the board.';}};
document.addEventListener('fullscreenchange',()=>document.body.classList.toggle('board-mode',!!document.fullscreenElement));
document.addEventListener('keydown',event=>{if($('connection').open)return;if(event.code==='Space'){event.preventDefault();pause();}if(event.key==='Escape')document.body.classList.remove('board-mode');});
document.addEventListener('visibilitychange',()=>{previous=0;});
function loading(value){busy=value;document.querySelector('.primary').disabled=value;$('files').disabled=value;$('forget').disabled=value;}
async function request(path,credential,teacher=false){
  if(!/^\/board-api(?:\/connect|\/[a-z0-9_-]{3,32}\/[1-9][0-9]{0,8})?$/.test(path))throw Error('Unexpected classroom response.');
  const result=await fetch(API+path,{headers:{[teacher?'X-Teacher-Password':'X-Board-Token']:credential},cache:'no-store',signal:AbortSignal.timeout(45000)});
  if(!result.ok){let message='Classroom could not be loaded.';try{message=(await result.json()).error||message;}catch{}const error=Error(message);error.status=result.status;throw error;}return result;
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
let connection;try{connection=readConnection(localStorage);}catch{}let autoEnabled=!!connection;
function connectionStatus(){ $('forget').hidden=!connection; }
async function refreshClass(){
  if(busy||!connection||!autoEnabled)return;
  loading(true);displayGeneration++;
  try{
    await foodReady;
    const list=await(await request('/board-api',connection.token)).json();
    if(!Array.isArray(list.pets))throw Error('Unexpected classroom response.');
    const result=await refreshRoster(list.pets,loaded,async item=>readBackup(await(await request(item.path,connection.token)).arrayBuffer(),item.sha256));
    if(result.pets.length||!list.pets.length)setPets(result.pets,'class');
    $('message').textContent=result.failures.join(' • ');
    $('caption').textContent=`${result.pets.length} Cyber ${result.pets.length===1?'Pet':'Pets'} · Auto-updates every minute${result.failures.length?' · Some updates unavailable — see Connect class':''}`;
  }catch(error){
    if(error.status===401){autoEnabled=false;connection=null;try{forgetConnection(localStorage);}catch{}connectionStatus();}
    $('message').textContent=error.message;
    $('caption').textContent=error.status===401?'Reconnect this board in Connect class.':'Class connection unavailable · Keeping current pets · Retrying automatically';
  }finally{loading(false);}
}
$('connect').onsubmit=async event=>{
  event.preventDefault();if(busy)return;loading(true);let password=$('password').value;$('password').value='';
  try{
    connection=await(await request('/board-api/connect',password,true)).json();
    autoEnabled=true;connectionStatus();
    let remembered=true;try{rememberConnection(localStorage,connection);}catch{remembered=false;}
    loading(false);await refreshClass();
    if(!remembered)$('message').textContent='Connected for this visit. Enable browser storage to remember this board.';
    else if(!$('message').textContent)$('connection').close();
  }catch(error){$('message').textContent=error.message;}finally{password='';loading(false);}
};
$('forget').onclick=()=>{autoEnabled=false;connection=null;try{forgetConnection(localStorage);}catch{}connectionStatus();setPets([],'local');$('message').textContent='Connection forgotten on this browser.';};

connectionStatus();
setInterval(()=>refreshClass(),60000);
window.addEventListener('online',()=>refreshClass());
$('files').onchange=async()=>{if(busy)return;const files=[...$('files').files];if(!files.length)return;autoEnabled=false;loading(true);try{await loadMany(files,async file=>{if(file.size>32*1024*1024)throw Error('Backup exceeds 32 MiB.');return readBackup(await file.arrayBuffer());},'local');}finally{$('files').value='';loading(false);}};
let demoData,displayGeneration=0;
async function demo(count=5){
  const generation=++displayGeneration;
  await foodReady;
  if(demoData){showDemo(count);return;}
  const config=await(await fetch('assets/demo.json')).json(),images=new Map();
  for(const action of ['idle','walking','eat','happy'])for(const name of config.animations[action]){const image=new Image();image.src='assets/'+name;await image.decode();images.set(name,image);}
  demoData={config,images};if(generation===displayGeneration)showDemo(count);
}
function showDemo(count){
  const names=['Pip','Fern','Echo','Moss','Nova','Clover','Pebble','Sunny','Orbit','Willow','Sprout','Luna'];
  sessionLikes.clear();
  const tastes=['Sweet','Salty','Sour','Bitter','Savory'];
  const data=Array.from({length:count},(_,i)=>({id:'sample-'+i,name:names[i%names.length]+(i>=names.length?' '+(1+Math.floor(i/names.length)):''),...demoData,tint:Math.floor(Math.random()*360),foodPreferences:{favorite_taste:tastes[i%5],hated_taste:tastes[(i+2)%5],favorite_food_tags:['Fresh','Fruity','Roasted'],hated_food_tags:['Bitter','Fermented','Charred']},personality:{activity_level:Math.random()*100,curiosity:Math.random()*100,sociability:Math.random()*100,generosity:Math.random()*100,bravery:Math.random()*100}}));
  setPets(data,'sample');
}
$('sample-crowd').onclick=async()=>{if(busy)return;autoEnabled=false;loading(true);try{await demo(Number($('crowd-count').value));$('connection').close();}finally{loading(false);}};
$('names').onchange=()=>{showNames=$('names').checked;};
resize();requestAnimationFrame(render);
(async()=>{try{await demo(5);}catch{$('caption').textContent='Connect your class to start.';}if(connection){$('caption').textContent='Loading your class · Five sample pets are keeping the board company';await refreshClass();}})();
