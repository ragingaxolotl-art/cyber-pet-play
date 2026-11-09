// Classroom grab rules: geometry must overlap AND fighters must be nearby.
// These are combat-frame durations; presentation pauses never advance a hold.
export const THROW_LIMITS=Object.freeze({reach:80,holdFrames:60,holdX:60,holdHeight:80});
export function validateThrow(attack){
 const rule=attack.throw;if(rule===undefined)return;
 if(!rule||typeof rule!=='object'||Array.isArray(rule)||Object.keys(rule).some(k=>!['holdFrames','holdX','holdHeight','target'].includes(k)))throw Error('Use a throw hold duration, placement and target rule.');
 if(attack.delivery!=='melee'||attack.payload!=='damage'||attack.hitEvents||attack.meleeClash||attack.guardInteraction||attack.hitLimit!==1)throw Error('Throws require a single melee damage contact without sequences, clashes or guard-break rules.');
 for(const [key,min,max] of [['holdFrames',1,60],['holdX',0,60],['holdHeight',0,80]])if(!Number.isInteger(rule[key])||rule[key]<min||rule[key]>max)throw Error('Throw '+key+' must be a whole number from '+min+' to '+max+'.');
 if(!['grounded','airborne','any'].includes(rule.target))throw Error('Choose grounded, airborne or any throw target.');
}
export function throwImmunity(defense){
 return !!defense?.windows?.some(w=>w.kind==='invulnerability'&&['all','throw'].includes(w.against));
}
// Input is a detached contact snapshot. Guard/armor do not stop a grab.
export function throwRejection({attack,active,contact,attacker,target,evading=false,defense=null}){
 validateThrow(attack);if(!attack.throw)return 'Not a throw.';
 if(!active||!contact)return 'No active grab contact.';
 if(attacker.hp<=0||target.hp<=0)return 'A fighter is defeated.';
 if(attacker.captured||attacker.holding||target.captured||target.holding)return 'A fighter is already in a throw.';
 if(Math.hypot(attacker.x-target.x,attacker.y-target.y)>THROW_LIMITS.reach)return 'Target is outside grab reach.';
 if(evading)return 'Target dodged the grab.';
 if(throwImmunity(defense))return 'Target is throw-invulnerable.';
 if(['down','wall','getting_up'].includes(target.reaction))return 'Target is knocked down.';
 if(attack.throw.target==='grounded'&&target.y<0||attack.throw.target==='airborne'&&target.y>=0)return 'Target does not match the throw target rule.';
 return '';
}
// Resolve reciprocal grabs as a mutual break. No actor-array ordering advantage.
export function resolveGrabAttempts(attempts){
 const eligible=attempts.filter(a=>!throwRejection(a));
 const broken=new Set(),accepted=[],reserved=new Set();
 for(const a of eligible)if(eligible.some(b=>a.attacker===b.target&&a.target===b.attacker)){broken.add(a.id);}
 for(const a of [...eligible].sort((a,b)=>String(a.id).localeCompare(String(b.id)))){
  if(broken.has(a.id)||reserved.has(a.attacker)||reserved.has(a.target))continue;
  reserved.add(a.attacker);reserved.add(a.target);accepted.push(a.id);
 }
 return {accepted,broken:[...broken].sort((a,b)=>String(a).localeCompare(String(b)))};
}
export function createThrowHold(attack,frame,facing){
 validateThrow(attack);if(!attack.throw||!Number.isInteger(frame)||![1,-1].includes(facing))throw Error('Throw capture requires a rule, combat frame and facing.');
 return {start:frame,releaseFrame:frame+attack.throw.holdFrames,facing,holdX:attack.throw.holdX,holdHeight:attack.throw.holdHeight};
}
export function heldPosition(hold,attacker,minX=35,maxX=925){
 return {x:Math.max(minX,Math.min(maxX,attacker.x+hold.facing*hold.holdX)),y:Math.min(0,attacker.y-hold.holdHeight)};
}
export function throwHoldPhase(hold,frame,{attackerAlive=true,targetAlive=true,interrupted=false}={}){
 if(!Number.isInteger(frame)||frame<hold.start)throw Error('Throw playback must use a combat frame at or after capture.');
 if(!attackerAlive||!targetAlive||interrupted)return 'cancel';
 return frame>=hold.releaseFrame?'release':'hold';
}
