// Diagnostics describe inspected runtime capabilities, not a guarantee of visual parity.
export function attackDiagnostics(attack,simulation=null,attacks=null) {
 const findings=[];
 const add=(code,level,message,action)=>findings.push({code,level,message,action});
 if(attack.projectileLifetime!==undefined)add('projectile-lifetime','info',`Projectile launches at startup and can survive interruption for up to ${attack.projectileLifetime} frames. Owner recovery runs independently. Defeat, expiry and parry remove the projectile.`, 'Requires version 7 saving. Test simultaneous contacts and interruption in Arena; classroom saving remains subject to server compatibility.');
 if(attack.hitEvents||(attack.launchHeight>0&&attack.pushAxis!=='x'))add('shared-juggle-budget','info','Ordinary and sequence reactions share a ten-reaction airborne budget. The grounded launcher counts as one; landing resets the budget.','At the limit, the target is forced toward the floor. Ordinary damage can still connect without restarting the launch. Guard, armor, invulnerability and parry interruptions do not spend this budget. Retest older long launch combos in Arena.');
 if(attack.cancelWindows){
  if(attack.cancelWindows.some(w=>w.automatic))add('automatic-followup','info','Automatic follow-ups start after both fighters resolve contact. The first eligible window has priority; chains stop after eight transitions.','Choose one target per automatic window and equip that attack. Arena comparison reports automatic transitions, contacts and resource or availability failures.');
  add('cancel-transfer','info','Manual follow-up windows require version 5; automatic follow-ups require version 6.','Classroom saving checks the required version before writing.');
  add('cancel-preview','warning','The single-attack preview does not execute a follow-up attack. A displayed window alone does not prove a combo connects.','Test the named follow-up in Arena during the window, with enough energy and the attack equipped.');
  add('cancel-rules','info','Manual and automatic follow-ups obey cooldown, energy, stun and recovery checks. Hit, block and parry conditions use this cast’s results.','Choose timing and allowed attacks in Follow-up windows. A miss condition waits for active timing to finish.');
  if(attacks){const available=new Set(attacks.map(a=>a.id)),missing=[...new Set(attack.cancelWindows.flatMap(w=>w.attacks).filter(id=>!available.has(id)))];if(missing.length)add('cancel-missing','warning',`${missing.length} follow-up attack reference(s) are missing from this project: ${missing.join(', ')}.`,'Import the named attacks or select replacements. References are preserved when saving.');}
  if(!['damage','push'].includes(attack.payload)&&attack.cancelWindows.some(w=>w.condition==='whiff'))add('cancel-whiff-payload','warning','A miss condition cannot activate on a support or defensive move.','Choose Any result, or After parrying for a parry move.');
 }

 if(attack.defenseWindows){
  if(attack.defenseWindows.some(w=>w.kind==='parry'))add('parry-behavior','info','Parry prevents an eligible hit and interrupts its attacker for the authored number of frames. A counterattack needs a separate automatic follow-up window with the After parrying condition.','Edit protection in Defense windows and the counterattack in Follow-up windows. Test both attacks in Arena; the single-attack preview does not run follow-ups.');
  if(attack.defenseWindows.some(w=>w.kind==='invulnerability'))add('invulnerability-behavior','info','Invulnerability prevents eligible damage, push reactions and statuses carried by those hits during its window. Existing status effects continue.','Choose attack types in Defense windows. Classroom saving requires a server that advertises invulnerability support.');
  add('armor-transfer','info','Defense windows require a version 4 project, bank or skill tree.','Use the updated Studio and Arena; classroom saving checks server compatibility before writing.');
  if(attack.defenseWindows.some(w=>w.kind==='armor'))add('armor-behavior','info','Armor takes damage and prevents ordinary hit reactions during its active frames. Status effects still apply; defeat ends the move.','Edit timing and hit limits in Armor windows. Overlapping windows consume their budgets in list order.');
  if(attack.defenseWindows.some(w=>w.against!=='all'&&w.against!=='melee'))add('armor-probe','info','The Studio incoming-hit probe is melee; it cannot demonstrate projectile-only or area-only defense.','Use Arena’s two-attack comparison to test the matching attack type.');
 }
 if(attack.hitboxGroups){
  const boxes=attack.hitboxGroups.reduce((n,g)=>n+g.boxes.length,0);
  if(attack.hitEvents)add('group-hits','info','Each sequence hit uses its assigned group and deals damage once. Group hit-limit settings do not add extra sequence hits.','Edit per-hit damage and group assignments in the hit inspector.');else add('group-hits','info',`${boxes} boxes in ${attack.hitboxGroups.length} hit group(s). Boxes in one group share hit limits; separate groups each apply full attack damage.`, 'Edit limits in the group inspector. Overlapping independent groups can deal damage on the same frame.');
  add('group-transfer','info','Multiple hitboxes require at least a version 3 project, bank or skill tree.','Use the updated Studio and Arena. Earlier versions cannot play this definition.');
 }
 if(attack.hitEvents){
  if(attack.sequenceTiming==='cast')add('scheduled-sequence','info','Melee/area hit windows count from the end of startup. A miss does not delay later hits; every hit still needs overlap.','Requires version 10 project, tree and bank support. Older classroom servers refuse this save; keep a downloaded backup.');
  else add('sequence-transfer','info','Save this sequence locally or to the upgraded classroom bank after teacher sign-in.','For Arena, download the project and use Open attack design. Version 2 skill trees can also be downloaded from Studio and opened in Arena.');
  add('sequence-damage','info','Damage is authored per hit; base damage, stat scaling and ordinary hit-limit settings do not apply.','Edit damage and reactions in the selected-hit inspector.');
  if(attack.projectileLifetime===undefined)add('sequence-lifetime','info','Follow-up hits end when the attacker is interrupted or the target is defeated.','Test interruption before relying on the full sequence.');
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
