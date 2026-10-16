import {advanceMagic} from './unicorn-events.js?v=26';
import {prepareCounterQueue} from './counter-queue.js?v=26';
import {advanceCounter} from './counter.js?v=26';
import {advanceHosts} from './npc-animation.js?v=26';
import {advanceFlyer} from './flyer.js?v=26';
import {tick,advanceTag,advanceInteractions,interactPets} from './motion.js?v=26';
import {advanceMeals} from './meals.js?v=26';
import {advanceGames} from './games.js?v=26';
import {advanceWorld} from './world.js?v=26';
import {advanceHygiene} from './hygiene.js?v=26';
import {advanceWash} from './wash.js?v=26';
// Keep this exact update order shared by the live board and coexistence tests.
// Active actions finish first, then care/play invitations, then optional scenery.
export function stepBoard(scene,pets,dt,time,aspect=16/9,artReady=true){
 const {counter,hosts,flyer,livingWorld,washHistory}=scene;
 prepareCounterQueue(counter,pets);for(const p of pets)tick(p,dt);
 advanceHosts(hosts,counter,dt);advanceFlyer(flyer,pets,dt,aspect,time);advanceCounter(counter,pets,dt,artReady);
 advanceTag(pets,dt);advanceInteractions(pets,dt);advanceMeals(pets,dt);
 advanceGames(pets,dt,time,scene.gameSchedule??={next:4,counts:{}});interactPets(pets);
 advanceWorld(livingWorld,pets,dt,time);advanceHygiene(pets,dt);advanceWash(washHistory,pets,dt);advanceMagic(flyer,pets,hosts,livingWorld,dt,time,aspect);
}
