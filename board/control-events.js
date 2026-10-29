import {controls,keyOf,weatherOverride,setControls} from './control-state.js';
import {seedBoardDisease,grantUnicornPotion} from './health.js?v=control45';
export function createCommandRunner(storage){
 let done=new Set();try{done=new Set(JSON.parse(storage?.getItem('board.commands.v1')||'[]'));}catch{}
 const results=new Map();
 return {results,run(scene,pets,time,now=Date.now()){
  for(const c of controls.commands){
   if(done.has(c.id)||c.expiresAt<=now)continue;
   const targets=pets.filter(p=>c.targets.includes(keyOf(p)));
   if(['outbreak','cure','emote'].includes(c.type)&&targets.length!==c.targets.length){results.set(c.id,'Waiting for selected pets to load');continue;}
   if(c.type==='cure'&&targets.some(p=>p.stair||p.playGroup||p.socialGroup||p.toyPlay||p.unicornCare)){results.set(c.id,'Waiting for current activities to finish');continue;}
   let message='Applied';
   if(c.type==='unicorn'){
    if(scene.flyer.state!=='absent'){results.set(c.id,'Waiting for the current visit to finish');continue;}
    scene.flyer.manualVisit=true;scene.flyer.nextVisit=scene.flyer.age;
   }else if(c.type==='rain'||c.type==='clear'){weatherOverride.until=time+60;weatherOverride.rain=c.type==='rain';}
   else if(c.type==='outbreak'){
    let count=0;for(const p of targets)if(seedBoardDisease(p,{family:c.value==='glitch_fever'?'infection':'parasites',id:c.value}))count++;
    message=`Applied to ${count}; immunity and existing illness respected`;
   }else if(c.type==='cure'){for(const p of targets)grantUnicornPotion(p,new Set(p.health?.conditions.map(c=>c.id)||[]));}
   else if(c.type==='emote'){for(const p of targets){p.emote=c.value;p.emoteTime=8;p.teacherEmote=c.value;p.teacherEmoteUntil=time+8;}}
   done.add(c.id);results.set(c.id,message);try{storage?.setItem('board.commands.v1',JSON.stringify([...done].slice(-300)));}catch{}
  }
 }};
}
export function pollControls(fetcher=fetch){return fetcher('https://cyber-pet-classroom-settings.ragingaxolotl.chatgpt.site/board-api/controls',{cache:'no-store',signal:AbortSignal.timeout(12000)}).then(async r=>{if(!r.ok)throw Error('Controls unavailable');return setControls(await r.json());});}
