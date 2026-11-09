import {validateAttackerMotion} from './attacker-motion.js?v=20261109-conditional-release';
export const ATTACKER_MOTION_PRESETS=[['dash-recoil','Dash and recoil'],['hop','Rising hop'],['retreat','Retreat']];
export function movementPreset(attack,kind,{startup=attack.startup,active=attack.active}={}){
 if(attack.attackerMotion?.length)throw Error('Remove existing movement segments before applying a starter.');
 if(!Number.isInteger(startup)||startup<0||!Number.isInteger(active)||active<1)throw Error('Movement starter needs valid combat timing.');
 const next=structuredClone(attack),duration=Math.max(1,Math.min(8,startup)),id=()=> 'move_'+crypto.randomUUID().replaceAll('-','');
 if(kind==='dash-recoil')next.attackerMotion=[{id:id(),start:0,duration,forward:40,rise:0},{id:id(),start:Math.max(duration,startup+active),duration:6,forward:-20,rise:0}];
 else if(kind==='hop')next.attackerMotion=[{id:id(),start:0,duration,forward:20,rise:40}];
 else if(kind==='retreat')next.attackerMotion=[{id:id(),start:0,duration:8,forward:-40,rise:0}];
 else throw Error('Choose a supported movement starter.');
 validateAttackerMotion(next);return next;
}
