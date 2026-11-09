import {Arena, fighter, RULES} from './combat-runtime.js?v=20261109-rotation';
import {validateAttack, freshAttack} from './combat-model.js?v=20261109-rotation';
import {validateProjectileSplit} from './projectile-split.js?v=20261109-split';
import {validateRecoveryFrame, recoverInAir} from './air-recovery.js';
import {combatPreviewFrame} from './combat-preview-frame.js?v=20261109-rotation';

// One simulation for all children: reactions, shields and combos belong to the
// actual shared target. The caller supplies Arena coordinates, not canvas pixels.
export function simulateRuntimeAttack(attack, attackerStats, targetStats, options = {}) {
 validateAttack(attack);validateProjectileSplit(attack);validateRecoveryFrame(options.recoveryFrame);
 if (options.facing !== undefined && ![1,-1].includes(options.facing)) throw Error('Facing must be left or right.');
 if (options.guard !== undefined && typeof options.guard !== 'boolean') throw Error('Guard must be on or off.');
 const resistance = options.resistance ?? 0;
 if (!Number.isFinite(resistance) || resistance < -50 || resistance > 75) throw Error('Resistance must be from -50 to 75 percent.');
 const incomingDamage = options.incomingDamage ?? 0, incomingFrame = options.incomingFrame ?? 30;
 if (!Number.isFinite(incomingDamage) || incomingDamage < 0 || incomingDamage > 500 || !Number.isInteger(incomingFrame) || incomingFrame < 0 || incomingFrame > 1800) throw Error('Incoming hit requires damage 0–500 and a whole frame 0–1800.');
 const limit = options.frames ?? 600;
 if (!Number.isInteger(limit) || limit < 1 || limit > 1800) throw Error('Preview needs 1–1800 combat frames.');
 const positions = [options.attackerX ?? 260, options.targetX ?? 700];
 if (positions.some(x => !Number.isFinite(x) || x < 35 || x > RULES.width - 35)) throw Error('Preview fighters must start inside the arena.');
 const height = options.targetHeight ?? 0;
 if (!Number.isFinite(height) || height < 0 || height > 600) throw Error('Target height must be from 0 to 600.');
 for (const key of ['selfHP', 'targetHP', 'energy']) {
  if (options[key] !== undefined && (!Number.isFinite(options[key]) || options[key] < 0 || options[key] > 1)) throw Error(key + ' must be a fraction from 0 to 1.');
 }
 const owner = fighter('Attacker', attackerStats), target = fighter('Target', targetStats);
 const arena = new Arena(owner, target, [structuredClone(attack)]);
 arena.ai = false;arena.paused = false;
 target.damageResistance = resistance;
 const opponentInput = new Set(options.guard ? ['Shift'] : []);
 owner.x = positions[0];target.x = positions[1];target.y = -height;
 owner.hp = Math.round(owner.maxHP * (options.selfHP ?? 1));
 target.hp = Math.round(target.maxHP * (options.targetHP ?? 1));
 owner.energy = Math.round(owner.maxEnergy * (options.energy ?? 1));
 const started = owner.hp > 0 && target.hp > 0 && arena.attack(owner, arena.attacks[0]);
 const reason = started ? '' : owner.hp <= 0 || target.hp <= 0 ? 'A fighter has no health.' : arena.reason(owner, arena.attacks[0]);
 // Arena normally auto-faces opponents. Studio also tests deliberately missed
 // projectiles facing away; only the authored cast direction is overridden.
 if (started && options.facing !== undefined) owner.cast.facing = options.facing;
 let recovery = options.recoveryFrame == null ? null : {attempted:false,recovered:false,reason:'Test ended before the recovery attempt.'};
 const frames = [], presentation = [];
 let incoming = incomingDamage ? {attempted:false,started:false,reason:'Test ended before the incoming hit.'} : null;
 // Impact pauses consume presentation time, never a projectile lifetime frame.
 // Bound the work even for imported timing settings; report truncation explicitly.
 const presentationLimit = limit * 121;
 while (started && arena.frame < limit && !arena.winner && arena.presentationFrame < presentationLimit) {
  // Schedule once on combat time, never again during an impact pause.
  if (incoming && !incoming.attempted && arena.frame === incomingFrame && arena.hitstopRemaining === 0) {
   const direction = owner.x >= target.x ? 1 : -1;
   const incomingAttack = {...freshAttack('melee'),id:'preview-incoming-hit',name:'Incoming test hit',
    startup:0,active:1,recovery:0,cooldown:0,cost:0,base:incomingDamage,coefficient:0,
    knockback:0,hitstun:0,box:{x:direction*(owner.x-target.x)-14,y:owner.y-target.y-60,w:28,h:60}};
   // A test hit samples contact at the attacker, independent of separation.
   // It still passes through ordinary action eligibility and defense resolution.
   target.guarding = false;
   const started = arena.attack(target, incomingAttack);
   incoming = {attempted:true,started,reason:started?'':arena.reason(target,incomingAttack),combatFrame:incomingFrame};
  }
  const previous = arena.frame;arena.tick(new Set(), 0, opponentInput);
  if (arena.frame !== previous) {
   // Studio's attack frame zero is Arena's first simulation tick.
   if (options.recoveryFrame != null && arena.frame - 1 === options.recoveryFrame) {
    const reason = recoverInAir(target, arena.frame);
    recovery = {attempted:true,recovered:!reason,reason,combatFrame:options.recoveryFrame};
   }
   frames.push(combatPreviewFrame(arena));
  }
  presentation.push(Math.max(0, frames.length - 1));
 }
 return {started, reason, recovery, incoming, frames, presentationFrames: presentation,
  final: combatPreviewFrame(arena), winner: arena.winner,
  truncated: started && !arena.winner && arena.frame < limit};
}
