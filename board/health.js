import {bestBoardMedicine} from './care-medicines.js?v=height1';
import {sanitizeConditions} from './condition-data.js?v=height1';
import {trait,love,travelSpeed} from './profile.js?v=height1';
import {freeForActivity} from './activity-state.js?v=height1';
import {resolveAction} from './pet-animation.js?v=height1';
// Seconds of board play, not real medical guidance or persistent health changes.
export const healthTuning={contactRadius:.085,avoidRadius:.15,exposureMinimum:8,exposureRange:16,doseSeconds:6};
export const contagious=new Set(['glitch_fever','parasite_spore_fan','static_mites']);
export const conditionNames={glitch_fever:'Glitch Fever',infection_crystal_rash:'Crystal Bloom',parasite_moss_crown:'Mosswire',parasite_spore_fan:'Sporefan',static_mites:'Static Mites',bitrot_patch:'Bitrot',phase_drift:'Phase Drift',injury_bruise:'Injury',fatigue_droplets:'Fatigue',queasy_bubbles:'Digestive discomfort',carb_bloat:'Carb Bloat',protein_knot:'Protein Knot',oil_churn:'Oil Churn',vitamin_fizz:'Vitamin Fizz',water_wobble:'Water Wobble',overfull:'Overfull Belly',travel_queasy:'Travel Queasiness',overwhelmed:'Crowd Frazzle',spooked:'Echo Fright',lonely:'Separation Static',chroma_drain:'Chroma Drain',signal_flicker:'Signal Flicker',mite_bite:'Static Mite Ambush',echo_strike:'Echo Wisp Strike',crystal_snare:'Crystal Crawler Pinch'};
export function carePreference(p){
 const caution=1-trait(p,'bravery'),routine=1-trait(p,'curiosity');
 return {medicineDelay:2+10*(1-trait(p,'assertiveness'))+4*(1-caution)+2*(1-routine),
  quarantineDelay:1+5*(1-trait(p,'generosity'))+4*trait(p,'sociability')+2*(1-love(p)),
  distance:.09+.045*caution+.015*(1-trait(p,'sociability')),
  avoidanceDelay:1+4*(1-caution)+2*trait(p,'sociability')};
}
const newHealth=()=>({conditions:[],saved:[],immune:new Set(),exposure:new Map(),age:0,dose:0,avoiding:0,avoidTime:0,isolated:false,recovered:0});
export function syncHealth(p){
 const saved=sanitizeConditions(p.data.conditions);
 if(!p.health&&!saved.length)return;
 const h=p.health??=newHealth();
 for(const family of ['digestive','infection','parasites','chronic','injury','fatigue','stress']){
  const next=saved.find(c=>c.family===family),before=h.saved.find(c=>c.family===family);
  if(JSON.stringify(next)===JSON.stringify(before))continue;
  h.conditions=h.conditions.filter(c=>c.family!==family);
  if(next){h.conditions.push({...next});h.immune.delete(next.id);h.potionProtection?.delete(next.id);}
  h.age=0;h.dose=0;h.isolated=false;
 }
 h.saved=saved;
 if(!h.conditions.length&&['quarantine','medicine'].includes(p.mode))finish(p);
}
function finish(p){p.mode='idle';p.timer=3;p.clock=0;p.decisionCooldown=3;p.emote='ok';p.emoteTime=3;p.health.isolated=false;}
// Freeze each source list before checking recipients: new infections cannot chain in the same step.
export function advanceContagion(pets,dt){
 const sources=pets.filter(p=>!p.stair&&!p.health?.isolated).flatMap(p=>(p.health?.conditions||[]).filter(c=>contagious.has(c.id)).map(c=>({p,c})));
 for(const p of pets){
  if(p.stair||p.health?.isolated)continue;
  const nearby=new Map();
  for(const {p:source,c} of sources)if(source!==p&&source.level===p.level&&Math.abs(source.x-p.x)<healthTuning.contactRadius)nearby.set(c.id,c);
  for(const [id,c] of nearby){
   const h=p.health??=newHealth();
   if(h.immune.has(id)||h.conditions.some(x=>x.family===c.family))continue;
   let dose=h.exposure.get(id);
   if(!dose){dose={contact:0,threshold:healthTuning.exposureMinimum+(p.random?.()??.5)*healthTuning.exposureRange};h.exposure.set(id,dose);}
   dose.contact+=dt;
   if(dose.contact>=dose.threshold){h.conditions.push({family:c.family,id,severity:1});h.transmissionsCaught=(h.transmissionsCaught||0)+1;h.age=0;h.dose=0;h.exposure.delete(id);p.emote='sweat';p.emoteTime=3;}
  }
  for(const [id,dose] of p.health?.exposure||[])if(!nearby.has(id)){dose.contact=Math.max(0,dose.contact-dt*2);if(!dose.contact)p.health.exposure.delete(id);}
 }
}
function care(p,dt){
 const h=p.health;if(!h?.conditions.length||p.unicornCare)return;
 if(p.mode==='avoidSick'){p.mode='idle';p.timer=1;p.clock=0;}
 h.age+=dt;
 const preferences=carePreference(p);
 if(freeForActivity(p)||['quarantine','medicine'].includes(p.mode)){
  if(h.age>=preferences.medicineDelay){if(p.mode!=='medicine'){p.mode='medicine';p.clock=0;}h.isolated=true;}
  else if(h.conditions.some(c=>contagious.has(c.id))&&h.age>=preferences.quarantineDelay){p.mode='quarantine';h.isolated=true;}
 }
 if(p.mode==='medicine'){
  h.conditions[0].medicine??=bestBoardMedicine(h.conditions[0]);
  h.dose+=dt;
  if(h.dose>=healthTuning.doseSeconds){
   h.dose-=healthTuning.doseSeconds;
   const c=h.conditions[0],medicine=c.medicine??=bestBoardMedicine(c);c.severity=medicine?.instant_cure?0:c.severity-(medicine?.treatment_power||1);if(c.severity>0)c.severity=Math.max(1,c.severity);else c.severity=0;
   if(!c.severity){h.immune.add(c.id);h.conditions.shift();h.recovered++;}
   if(!h.conditions.length)finish(p);
  }
 }
}
function avoid(p,pets,dt){
 if(p.health?.conditions.length||p.health?.isolated||p.stair)return;
 const preference=carePreference(p);
 const sick=pets.filter(other=>other!==p&&other.level===p.level&&!other.stair&&other.health?.conditions.some(c=>contagious.has(c.id))).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
 if(p.mode==='avoidSick'){
  const h=p.health;h.avoidTime+=dt;
  if(!sick||Math.abs(sick.x-p.x)>=preference.distance||h.avoidTime>=5){finish(p);h.avoiding=0;return;}
  // Stay on this floor, never wrap or teleport. Choose the direction with space at an edge.
  let direction=Math.sign(p.x-sick.x)||p.direction||1;
  if(p.x<.04&&direction<0||p.x>.96&&direction>0)direction*=-1;
  p.direction=direction;p.x=Math.max(.02,Math.min(.98,p.x+direction*travelSpeed(p)*dt));return;
 }
 if(!sick||Math.abs(sick.x-p.x)>=healthTuning.avoidRadius){if(p.health)p.health.avoiding=0;return;}
 const h=p.health??=newHealth();h.avoiding+=dt;
 if(h.avoiding>=preference.avoidanceDelay&&freeForActivity(p)&&resolveAction(p.data,'walking')){p.mode='avoidSick';p.clock=0;h.avoidTime=0;p.emote='thinking';p.emoteTime=5;}
}
export function advanceHealth(pets,dt){
 if(!Number.isFinite(dt)||dt<=0)return;
 // Large time jumps are discarded, just as the board's render loop discards suspended time.
 dt=Math.min(dt,.25);
 for(const p of pets)syncHealth(p);
 advanceContagion(pets,dt);
 for(const p of pets){care(p,dt);avoid(p,pets,dt);}
}
export function conditionVisual(p,seconds,reducedMotion=false){
 let gray=0,alpha=1;
 for(const c of p.health?.conditions||[]){
  if(c.id==='chroma_drain')gray=Math.max(gray,.35+.6*c.severity/3);
  if(c.id==='signal_flicker'){gray=Math.max(gray,.2);const depth=.18+.22*c.severity/3;alpha=1-depth*(reducedMotion?.5:.5-.5*Math.cos(2*Math.PI*seconds/2.4));}
 }
 return {gray,alpha};
}
export function healthLabel(p){
 const c=p.health?.conditions[0];
 if(!c)return p.mode==='avoidSick'?'Giving space':p.health?.potionProtection?.size?'Potion shield':'';
 const stage=c.severity<=1?'Mild':c.severity<=2?'Moderate':'Severe';
 return `${conditionNames[c.id]} · ${stage} · ${p.unicornCare?'Unicorn potion':p.mode==='medicine'?(c.medicine?.label||'Receiving care'):p.mode==='quarantine'?'Quarantine':contagious.has(c.id)?'Contagious':'Not contagious'}`;
}
// Small personal care boundary follows stationary characters too; no walk art is required.
export function drawHealth(ctx,p,x,y,size){
 const label=healthLabel(p);if(!label)return;
 ctx.save();
 if(p.health?.potionProtection?.size){ctx.strokeStyle='#d8b7ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-size*.6,y-24);ctx.lineTo(x-size*.6+7,y-27);ctx.lineTo(x-size*.6+14,y-24);ctx.lineTo(x-size*.6+12,y-14);ctx.lineTo(x-size*.6+7,y-9);ctx.lineTo(x-size*.6+2,y-14);ctx.closePath();ctx.stroke();}
 const c=p.health?.conditions[0],fallback={digestive:'queasy_bubbles',stress:'phase_drift',injury:'injury_bruise'};
 const icon=c&&conditionArt.get(c.id)||conditionArt.get(fallback[c?.family]);if(icon){const scale=c.severity<=1?20:c.severity<=2?26:32;ctx.imageSmoothingEnabled=false;ctx.drawImage(icon,x+size*.5,y-size*.7,scale,scale);}
 const swirl=conditionArt.get('confused_swirl');if(swirl&&c?.severity>2&&['stress','infection'].includes(c.family))ctx.drawImage(swirl,x-16,y-size-35,32,32);
 if(p.health?.isolated){ctx.strokeStyle='#83e5df';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.ellipse(x,y,Math.max(22,size*.65),8,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
 if(p.mode==='medicine'){ctx.fillStyle='#b3f4ed';ctx.fillRect(x+size*.45,y-24,9,16);ctx.fillStyle='#eefcf9';ctx.fillRect(x+size*.45+1,y-28,7,4);}
 ctx.font='600 10px system-ui';ctx.textAlign='center';const width=ctx.measureText(label).width+10;ctx.fillStyle='#172a43ec';ctx.fillRect(x-width/2,y+37,width,16);ctx.fillStyle='#e0fff8';ctx.fillText(label,x,y+48);ctx.restore();
}

const conditionArt=new Map();
export async function loadConditionArt(){
 await Promise.allSettled(['glitch_fever','infection_crystal_rash','parasite_moss_crown','parasite_spore_fan','static_mites','bitrot_patch','phase_drift','injury_bruise','fatigue_droplets','queasy_bubbles','confused_swirl'].map(async id=>{const img=new Image();img.src=`assets/care/${id}.png`;await img.decode();conditionArt.set(id,img);}));
}

// One delivered magical board potion clears the patient's current conditions and shields
// against the contagious variants in this outbreak. A different future disease can still occur.
export function grantUnicornPotion(p,outbreakIds){
 const h=p.health;if(!h)return;
 for(const id of outbreakIds)h.immune.add(id);
 h.potionProtection=new Set([...(h.potionProtection||[]),...outbreakIds]);
 for(const c of h.conditions){h.immune.add(c.id);h.recovered++;}
 h.conditions=[];h.exposure.clear();h.dose=0;p.unicornCare=false;finish(p);p.emote='hearts';p.emoteTime=5;
}

// Ambient outbreaks only change the board's health state, never the uploaded save.
export function seedBoardDisease(p,condition){
 if(!contagious.has(condition.id)||p.health?.conditions.length||p.unicornCare||p.health?.immune.has(condition.id)||p.health?.potionProtection?.has(condition.id))return false;
 const h=p.health??=newHealth();h.conditions.push({...condition,severity:1});h.age=0;h.dose=0;h.isolated=false;p.emote='sweat';p.emoteTime=3;return true;
}
