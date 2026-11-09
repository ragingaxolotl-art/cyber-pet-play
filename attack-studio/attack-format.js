// Container versions protect combat behavior from silent loss in older clients.
export const attackVersion=attack=>attack?.projectileSplit!==undefined?22:attack?.projectileArea?.blastFrames!==undefined?21:attack?.projectileArea!==undefined?20:attack?.projectileContact!==undefined?19:attack?.defenseWindows?.some(w=>w.energyGain!==undefined)?18:attack?.projectileSteering!==undefined?17:(attack?.bounces!==undefined||attack?.hitEvents?.some(e=>e.bounces!==undefined))?16:(attack?.hitstunScaling!==undefined||attack?.hitEvents?.some(e=>e.hitstun!==undefined))?15:attack?.counterHit!==undefined?14:attack?.comboScaling!==undefined?13:attack?.contactFeedback!==undefined?12:attack?.movementCancels!==undefined?11:attack?.sequenceTiming==='cast'?10:attack?.defenseWindows?.some(w=>['reflect','absorb'].includes(w.kind))?9:attack?.projectileDurability!==undefined?8:attack?.projectileLifetime!==undefined?7:attack?.cancelWindows?.some(w=>w.automatic===true)?6:attack?.cancelWindows!==undefined?5:attack?.defenseWindows!==undefined?4:attack?.hitboxGroups!==undefined?3:attack?.hitEvents?2:1;
export const attacksVersion=attacks=>Math.max(1,...attacks.map(attackVersion));
export function requireGroupVersion(version,attacks){
 if(version<22&&attacks.some(a=>a?.projectileSplit!==undefined))throw Error('Splitting projectiles require a version 22 file.');
 if(version<21&&attacks.some(a=>a?.projectileArea?.blastFrames!==undefined))throw Error('Expanding explosions require a version 21 file.');
 if(version<20&&attacks.some(a=>a?.projectileArea!==undefined))throw Error('Projectile impact areas require a version 20 file.');
 if(version<19&&attacks.some(a=>a?.projectileContact!==undefined))throw Error('Projectile contact policy requires a version 19 file.');
 if(version<18&&attacks.some(a=>a?.defenseWindows?.some(w=>w.energyGain!==undefined)))throw Error('Absorption energy requires a version 18 file.');
 if(version<17&&attacks.some(a=>a?.projectileSteering!==undefined))throw Error('Projectile steering requires a version 17 file.');
 if(version<16&&attacks.some(a=>a?.bounces!==undefined||a?.hitEvents?.some(e=>e.bounces!==undefined)))throw Error('Bounce rules require a version 16 file.');
 if(version<15&&attacks.some(a=>a?.hitstunScaling!==undefined||a?.hitEvents?.some(e=>e.hitstun!==undefined)))throw Error('Hitstun scaling requires a version 15 file.');
 if(version<14&&attacks.some(a=>a?.counterHit!==undefined))throw Error('Counter-hit rules require a version 14 file.');
 if(version<13&&attacks.some(a=>a?.comboScaling!==undefined))throw Error('Combo scaling requires a version 13 file.');
 if(version<12&&attacks.some(a=>a?.contactFeedback!==undefined))throw Error('Contact feedback requires a version 12 file.');
 if(version<11&&attacks.some(a=>a?.movementCancels!==undefined))throw Error('Movement cancels require a version 11 file.');
 if(version<10&&attacks.some(a=>a?.sequenceTiming==='cast'))throw Error('Scheduled melee/area hits require a version 10 file.');
 if(version<9&&attacks.some(a=>a?.defenseWindows?.some(w=>['reflect','absorb'].includes(w.kind))))throw Error('Projectile defense windows require a version 9 file.');
 if(version<8&&attacks.some(a=>a?.projectileDurability!==undefined))throw Error('Projectile durability requires a version 8 file.');
 if(version<7&&attacks.some(a=>a?.projectileLifetime!==undefined))throw Error('Independent projectile lifetime requires a version 7 file.');
 if(version<6&&attacks.some(a=>a?.cancelWindows?.some(w=>w.automatic===true)))throw Error('Automatic follow-ups require a version 6 file.');
 if(version<5&&attacks.some(a=>a?.cancelWindows!==undefined))throw Error('Cancel windows require a version 5 file.');
 if(version<4&&attacks.some(a=>a?.defenseWindows!==undefined))throw Error('Defense windows require a version 4 file.');
 if(version<3&&attacks.some(a=>a?.hitboxGroups!==undefined))throw Error('Multiple hitboxes require a version 3 file.');
}
