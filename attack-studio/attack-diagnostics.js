// Diagnostics describe inspected runtime capabilities, not a guarantee of visual parity.
export function attackDiagnostics(attack,simulation=null) {
 const findings=[];
 const add=(code,level,message,action)=>findings.push({code,level,message,action});
 if(attack.hitEvents){
  add('sequence-transfer','info','Save this sequence locally or to the upgraded classroom bank after teacher sign-in.','For Arena, download the project and use Open attack design. Skill-tree publication is not yet supported.');
  add('sequence-damage','info','Damage is authored per hit; base damage, stat scaling and ordinary hit-limit settings do not apply.','Edit damage and reactions in the selected-hit inspector.');
  add('sequence-lifetime','info','Follow-up hits end when the attacker is interrupted or the target is defeated.','Test interruption before relying on the full sequence.');
 }else{
  if(attack.knockback>0||attack.launchHeight>0||attack.wallSlam||attack.floorSlam)
   add('legacy-recovery','warning','Authored travel is shared, but recovery timing and stage boundaries still differ between Studio and Arena.','Test this move in Arena, including near a wall, before balancing a follow-up combo.');
  if(['slow','haste','weaken'].includes(attack.status))
   add('status-playtest','info','Status power is a percentage. Slow and haste multiply movement speed; weaken reduces outgoing damage.','Test movement in Arena; Studio’s stationary target does not demonstrate speed changes.');
 }
 if(simulation){
  if(!simulation.cast)add('energy','warning','The attack did not start because the test fighter lacked energy.','Increase test energy or reduce the attack cost.');
  else if(simulation.frames.at(-1)?.hits===0&&!['block','dodge'].includes(attack.payload))
   add('no-contact','warning','No hit connected in this test scenario.','Check target position, hitbox path and active timing.');
  const missed=simulation.hitResults?.filter(hit=>hit.result==='Missed')||[];
  if(missed.length)add('missed-followups','warning',`${missed.length} hit window(s) missed in this scenario.`,'Review the hit-by-hit results; check target restrictions and repeated-contact geometry.');
 }
 if(!findings.length)add('no-known-difference','info','No known setting-specific compatibility warning for this attack.','Test in Arena; this check does not validate every combat interaction.');
 return findings;
}
