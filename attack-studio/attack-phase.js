import {activeEnd,castEnd} from './contact-timing.js';
import {ownerActionEnd} from './projectile-lifetime.js?v=20261109-split';

// Capture before resolving any contact. Independent projectiles do not extend
// their owner's attack phase; contact-triggered moves wait in active phase.
// This describes timing only, not whether armor/guard permits a counter-hit.
export function attackPhase(cast,frame){
 if(!cast)return 'idle';
 const age=frame-cast.start;
 if(age<0)return 'idle';
 const independentEnd=ownerActionEnd(cast);
 const end=independentEnd??castEnd(cast.impact,cast.tm);
 if(age>=end)return 'idle';
 if(age<cast.tm.startup)return 'startup';
 const activeUntil=independentEnd===null?activeEnd(cast.impact,cast.tm):cast.tm.startup+cast.tm.active;
 return age<activeUntil?'active':'recovery';
}
