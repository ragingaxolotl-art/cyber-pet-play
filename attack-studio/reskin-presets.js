import {freshAttack,validateAttack} from './combat-model.js?v=20261024-starters';
import {familyKey,createReskinGroup} from './reskin-groups.js?v=20261024-starters';
// Editable starting balance, shared by matching elemental artwork. No elemental bonuses.
export const RESKIN_PROFILES={
 block_side:{payload:'block',base:0,cost:10,scaling:'stamina',active:45,blockPercent:85,path:[[0,0],[0,0]]},
 channel_power_side:{payload:'damage',base:20,cost:18,scaling:'intelligence',path:[[0,0],[110,0]]},
 dodge_side:{payload:'shield',delivery:'self',base:14,cost:10,scaling:'speed',path:[[0,0],[-20,0]],notes:'Evasive ward: grants a short shield; the artwork retreats. Does not move the attacker.'},
 down_summon_side:{payload:'damage',base:24,cost:20,scaling:'intelligence',path:[[72,-90],[72,0]],floorSlam:true},
 gather_power_side:{payload:'energy',delivery:'self',base:22,cost:4,scaling:'focus',path:[[0,0],[0,0]]},
 get_up_side:{payload:'heal',delivery:'self',base:18,cost:12,scaling:'stamina',path:[[0,0],[0,-12]],notes:'Recovery artwork restores the caster’s HP.'},
 ground_slam_side:{payload:'damage',base:28,cost:22,scaling:'strength',path:[[15,0],[120,0]],box:{x:-18,y:-22,w:36,h:22},knockback:24,floorSlam:true},
 knocked_down_side:{payload:'damage',base:18,cost:18,scaling:'strength',path:[[0,0],[110,0]],launchHeight:35,floorSlam:true,notes:'Knockdown-themed impact launches the opponent; it does not knock down the caster.'},
 release_power_side:{payload:'damage',base:26,cost:22,scaling:'intelligence',path:[[0,0],[200,0]],duration:75},
 side_push_side:{payload:'push',base:0,cost:10,scaling:'strength',path:[[0,0],[130,0]],knockback:65,pushAxis:'x',wallSlam:true},
 spin_hit_side:{payload:'damage',base:18,cost:16,scaling:'speed',path:[[0,0],[35,-12],[95,0]],knockback:16},
 stunned_side:{payload:'damage',base:8,cost:18,scaling:'focus',path:[[0,0],[110,0]],status:'stun',statusDuration:45,notes:'A light hit with a short stun.'},
 up_summon_side:{payload:'damage',base:22,cost:20,scaling:'intelligence',path:[[72,50],[72,-55]],launchHeight:45,pushAxis:'y'},
 victory_front:{payload:'shield',delivery:'self',base:24,cost:16,scaling:'charisma',path:[[0,0],[0,-8]],notes:'Victory-themed support grants a shield to the caster.'}
};
export function reskinStarters(effects){const families=new Map();for(const e of effects){const key=familyKey(e);if(key&&RESKIN_PROFILES[e.slot]&&(!families.has(key)||e.element==='earth'))families.set(key,e);}return [...families.values()].sort((a,b)=>a.slot.localeCompare(b.slot)||a.variant-b.variant);}
export function createReskinStarter(effect,effects){
 const profile=RESKIN_PROFILES[effect.slot];if(!familyKey(effect)||!profile)throw Error('No starter is available for this artwork.');
 const a=freshAttack(),variant=Math.max(0,Math.min(2,Number(effect.variant)-1));
 Object.assign(a,{delivery:'area',payload:profile.payload,scaling:profile.scaling,base:profile.base?profile.base+variant*3:0,cost:profile.cost+variant*2,coefficient:.35,startup:0,active:profile.active||12,recovery:24+variant*4,cooldown:90+variant*15,knockback:profile.knockback??12,launchHeight:profile.launchHeight??0,pushAxis:profile.pushAxis||'both',wallSlam:profile.wallSlam||false,floorSlam:profile.floorSlam||false,blockPercent:profile.blockPercent??100,status:profile.status||'none',statusDuration:profile.statusDuration||180,shieldDuration:120,box:profile.box||{x:-16,y:-55,w:32,h:50},name:effect.name.slice(0,48),motion:effect.slot,element:effect.element,tags:['reskin-starter',effect.element],motionPath:profile.path.map(([x,y])=>({x,y})),pathDuration:profile.duration||45+variant*6,reskinPresetVersion:1});
 if(profile.delivery)a.delivery=profile.delivery;
 a.impactTrigger=a.delivery==='self'||a.payload==='block'?'timed':'contact';
 if(a.impactTrigger==='timed')a.startup=Math.min(90,Math.round(effect.times.slice(0,effect.impact-1).reduce((x,y)=>x+y,0)*60/1000));
 a.notes='Editable reskin starter. '+(profile.notes||'Stats and path are a starting point for playtesting.')+' Matching elemental skins share edits.';
 a.visuals=[{effectId:effect.id,x:0,y:0,scale:effect.default_scale??1,start:0,rate:1,loopUntilImpact:a.impactTrigger==='contact',loopStart:1,loopEnd:Math.max(1,effect.impact-1)}];
 validateAttack(a,new Set(effects.map(e=>e.id)));
 return createReskinGroup([a],a,effect,effects,()=>freshAttack().id);
}
