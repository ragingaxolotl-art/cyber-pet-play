import {seedBoardDisease,contagious} from './health.js?v=outbreak1';
// One random roll per active minute: a uniformly distributed start in minutes 1–30.
export const outbreakTuning={checkSeconds:60,maximumMinutes:30};
export const outbreakChance=minute=>minute<1?0:Math.min(1,1/Math.max(1,outbreakTuning.maximumMinutes+1-minute));
export const outbreakDiseases=[{family:'infection',id:'glitch_fever'},{family:'parasites',id:'parasite_spore_fan'},{family:'parasites',id:'static_mites'}];
const eligible=(p,c)=>!p.health?.conditions.length&&!p.unicornCare&&!p.health?.immune.has(c.id)&&!p.health?.potionProtection?.has(c.id);
export function advanceOutbreaks(scene,pets,dt){
 if(!pets.length||!Number.isFinite(dt)||dt<=0)return;
 const s=scene.outbreakSchedule??={seconds:0,nextCheck:60,active:false,started:0},random=s.random||scene.flyer?.random||Math.random;
 const active=pets.some(p=>p.health?.conditions.some(c=>contagious.has(c.id)));
 // An imported outbreak also satisfies the schedule; do not stack a fresh outbreak on it.
 if(active&&!s.active){s.seconds=0;s.nextCheck=60;}s.active=active;
 s.seconds=Math.min(1800,s.seconds+Math.min(dt,.25));
 if(active||s.seconds+1e-7<s.nextCheck)return;
 const minute=Math.min(30,Math.floor((s.seconds+1e-7)/60));
 s.nextCheck=s.seconds>=1800?1800:(minute+1)*60;
 const choices=outbreakDiseases.map(c=>({c,pets:pets.filter(p=>eligible(p,c))})).filter(row=>row.pets.length);
 if(!choices.length){s.nextCheck=s.seconds>=1800?1800:(minute+1)*60;return;}
 // At the deadline hold a pending attempt until someone becomes eligible, without rerolling.
 if(minute<30&&random()>=outbreakChance(minute))return;
 const alternatives=choices.filter(row=>row.c.id!==s.lastDisease),pool=alternatives.length?alternatives:choices;
 const choice=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];
 const p=choice.pets[Math.min(choice.pets.length-1,Math.floor(random()*choice.pets.length))];
 if(seedBoardDisease(p,choice.c)){s.seconds=0;s.nextCheck=60;s.active=true;s.started++;s.lastDisease=choice.c.id;}
}
