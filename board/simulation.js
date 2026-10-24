import {advanceOutbreaks} from './outbreaks.js?v=height1';
import {advanceHealth} from './health.js?v=height1';
import {preserveRecovery} from './activity-state.js?v=height1';
import {advancePetPresentation} from './pet-animation.js?v=height1';
import {advanceMagic} from './unicorn-events.js?v=height1';
import {prepareCounterQueue} from './counter-queue.js?v=height1';
import {advanceCounter} from './counter.js?v=height1';
import {advanceHosts} from './npc-animation.js?v=height1';
import {advanceFlyer} from './flyer.js?v=height1';
import {tick,advanceTag,advanceInteractions,interactPets} from './motion.js?v=height1';
import {advanceMeals} from './meals.js?v=height1';
import {advanceGames} from './games.js?v=height1';
import {advanceWorld} from './world.js?v=height1';
import {advanceHygiene} from './hygiene.js?v=height1';
import {advanceWash} from './wash.js?v=height1';
// Keep this exact update order shared by the live board and coexistence tests.
// Active actions finish first, then care/play invitations, then optional scenery.
export function stepBoard(scene,pets,dt,time,aspect=16/9,artReady=true){
 const {counter,hosts,flyer,livingWorld,washHistory}=scene;
 const run=fn=>{const before=new Map(pets.map(p=>[p,p.mode]));fn();preserveRecovery(pets,before);};
 for(const p of pets)p.decisionCooldown=Math.max(0,(p.decisionCooldown||0)-dt);
 advanceHealth(pets,dt);advanceOutbreaks(scene,pets,dt);
 prepareCounterQueue(counter,pets);run(()=>{for(const p of pets)tick(p,dt);});
 advanceHosts(hosts,counter,dt);run(()=>advanceFlyer(flyer,pets,dt,aspect,time));run(()=>advanceCounter(counter,pets,dt,artReady));
 run(()=>advanceTag(pets,dt));run(()=>advanceInteractions(pets,dt));
 // Rotate which optional invitation system gets first choice. Active modes remain owned.
 const gameSchedule=scene.gameSchedule??={next:4,counts:{},lastStarted:0};
 const choices=[()=>advanceMeals(pets,dt),()=>advanceGames(pets,dt,time,gameSchedule),()=>interactPets(pets),()=>advanceWorld(livingWorld,pets,dt,time),()=>advanceHygiene(pets,dt)];
 // After a quiet spell, free pets get a play invitation before optional care.
 // Never interrupt an owned activity, a food reaction, or recovery.
 const first=time-(gameSchedule.lastStarted??0)>=30?1:Math.floor(time/12)%choices.length;for(let i=0;i<choices.length;i++)run(choices[(first+i)%choices.length]);
 advanceWash(washHistory,pets,dt);advanceMagic(flyer,pets,hosts,livingWorld,dt,time,aspect);for(const p of pets)advancePetPresentation(p,dt);
}
