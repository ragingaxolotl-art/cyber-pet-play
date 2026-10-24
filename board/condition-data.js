// Shared with the public archive projection. Only these fictional display fields leave the save.
export const families=['digestive','infection','parasites','chronic','injury','fatigue','stress'];
const causes={digestive:['carb_bloat','protein_knot','oil_churn','vitamin_fizz','water_wobble','overfull','travel_queasy'],stress:['overwhelmed','spooked','lonely','chroma_drain','signal_flicker'],injury:['mite_bite','echo_strike','crystal_snare']};
const variants={digestive:['queasy_bubbles'],infection:['infection_crystal_rash','glitch_fever'],parasites:['parasite_moss_crown','parasite_spore_fan','static_mites'],chronic:['bitrot_patch'],injury:['injury_bruise'],fatigue:['fatigue_droplets'],stress:['phase_drift']};
export function sanitizeConditions(value){
 if(!Array.isArray(value))return [];
 return families.flatMap(family=>{const c=value.find(c=>c&&c.family===family&&[...variants[family],...(causes[family]||[])].includes(c.id)&&Number.isFinite(c.severity)&&c.severity>0&&c.severity<=3);return c?[{family,id:c.id,severity:c.severity}]:[];});
}
export async function readConditions(progress,characterId){
 if(Array.isArray(progress.board_conditions))return sanitizeConditions(progress.board_conditions);
 const output=[];
 for(const family of families){
  const c=progress[(family==='parasites'?'parasite':family)+'_care'];
  if(!c||!Number.isFinite(c.seconds_left)||c.seconds_left<=0||!Number.isFinite(c.severity)||c.severity<=0||c.severity>3)continue;
  let id=variants[family][0];
  if(family==='infection'||family==='parasites'){
   const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('condition-art-v1/'+characterId+'/'+family)));
   const seed=new DataView(bytes.buffer).getUint32(0);
   id=family==='infection'?variants.infection[seed%2]:c.parasite_type==='plant_basic'?'parasite_moss_crown':variants.parasites[1+seed%2];
  }
  if(causes[family]?.includes(c.origin?.cause))id=c.origin.cause;
  output.push({family,id,severity:c.severity});
 }
 return output;
}
