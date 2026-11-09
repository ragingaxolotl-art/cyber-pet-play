// Guard interactions are attack-wide and use combat frames (60 per second).
// They do not bypass evasion, invulnerability, parry, or eligible armor.
export const GUARD_RECOVERY_LIMIT=120;
export function validateGuardInteraction(attack) {
 const rule=attack.guardInteraction;if(rule===undefined)return;
 if(!rule||typeof rule!=='object'||Array.isArray(rule)||Object.keys(rule).some(k=>!['mode','recoveryFrames'].includes(k)))throw Error('Use guard mode and recovery frames.');
 if(!['break','crush'].includes(rule.mode))throw Error('Choose guard break or guard crush.');
 if(!Number.isInteger(rule.recoveryFrames)||rule.recoveryFrames<1||rule.recoveryFrames>GUARD_RECOVERY_LIMIT)throw Error('Guard recovery must be 1–120 whole frames.');
 if(!['damage','push'].includes(attack.payload)||!['melee','projectile','area'].includes(attack.delivery)||attack.blockable!==true)throw Error('Guard interactions require a blockable damage or push attack.');
}
// Select from the collision snapshot, before any same-frame contact mutates guard.
export function guardContactRule(attack,guarding) {
 validateGuardInteraction(attack);
 const rule=guarding&&attack.blockable?attack.guardInteraction:null;
 return {guarded:!!guarding&&attack.blockable!==false&&rule?.mode!=='break',mode:rule?.mode??null,recoveryFrames:rule?.recoveryFrames??0};
}
// Invoke only after defense resolution accepts the contact. Armor and parry
// intentionally leave their own recovery/state rules in control.
export function applyGuardRecovery(target,contact,outcome,frame) {
 if(!contact.mode||!['hit','block'].includes(outcome)||target.hp<=0)return false;
 if(!Number.isInteger(frame)||frame<0)throw Error('Guard recovery needs a whole combat frame.');
 const until=frame+contact.recoveryFrames+1;
 target.cast=null;target.guarding=false;target.blockstunUntil=0;target.blockstunReduction=0;
 target.dashUntil=0;target.dodgeUntil=0;
 target.stun=Math.max(target.stun??0,until);target.hitstunUntil=Math.max(target.hitstunUntil??0,until);
 target.reactionUntil=Math.max(target.reactionUntil??0,until);
 if(target.reaction==='standing'){target.reaction='hurt';target.reactionStart=frame;}
 return true;
}
