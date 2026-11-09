// Detached replay data for Studio: never retain mutable fighters or cast trackers.
import {impactAreaBox} from './projectile-area.js';
export function combatPreviewFrame(arena) {
 const actor = fighter => ({name: fighter.name, x: fighter.x, y: fighter.y,
  hp: fighter.hp, maxHP: fighter.maxHP, energy: fighter.energy,
  shield: fighter.shield, facing: fighter.facing, reaction: fighter.reaction,
  blocking: fighter.guarding, ownerActive: !!fighter.cast, reactionStart: fighter.reactionStart, reactionUntil: fighter.reactionUntil,
  lastHit: fighter.lastHit, hitstunUntil: fighter.hitstunUntil, reactionInFlight: fighter.reactionInFlight,
  stun: fighter.stun, statuses: structuredClone(fighter.statuses)});
 const projectiles = arena.projectiles.entries
  .filter(entity => entity.owner.hp > 0 && entity.target.hp > 0 && arena.frame >= entity.spawnFrame && arena.frame < entity.expires)
  .flatMap(entity => {
   const prepared = arena.prepareCast(entity.owner, entity.target, entity.cast);
   if (!prepared) return [];
   return [{id: entity.id, owner: arena.fighters.indexOf(entity.owner),
    target: arena.fighters.indexOf(entity.target), expires: entity.expires,
    age: prepared.age, impact: entity.cast.impact, box: {...prepared.box},
    boxes: prepared.boxes ? structuredClone(prepared.boxes) : null,
    attack: structuredClone(entity.cast.a), facing: entity.cast.facing,
    splitRay: entity.cast.splitRay ? {...entity.cast.splitRay} : null,
    steering: entity.cast.steering ? {...entity.cast.steering} : null,
    attached: entity.cast.sequence?.attached === true}];
  });
 return {frame: arena.frame, presentationFrame: arena.presentationFrame,
  hitstopRemaining: arena.hitstopRemaining, fighters: arena.fighters.map(actor),
  projectiles, areas: arena.areas.filter(area => area.owner.hp > 0 && area.target.hp > 0 && arena.frame >= area.start && arena.frame < area.end)
   .map(area => ({...impactAreaBox(area, arena.frame)})),
  feedback: arena.contactFeedback.map(c => ({attacker:arena.fighters.indexOf(c.attacker),target:arena.fighters.indexOf(c.target),damage:c.damage??0,outcome:c.outcome})),
  hitResults: structuredClone(arena.lastHitResults),
  contacts: structuredClone(arena.lastProjectileContacts),
  areaContacts: structuredClone(arena.lastAreaContacts),
  combos: arena.combos.snapshot().map(({attacker, target, ...values}) =>
   ({...values, attacker: arena.fighters.indexOf(attacker), target: arena.fighters.indexOf(target)}))};
}
