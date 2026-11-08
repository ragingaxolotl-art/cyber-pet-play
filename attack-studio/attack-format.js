// Container versions protect combat behavior from silent loss in older clients.
export const attackVersion=attack=>attack?.movementCancels!==undefined?11:attack?.sequenceTiming==='cast'?10:attack?.defenseWindows?.some(w=>['reflect','absorb'].includes(w.kind))?9:attack?.projectileDurability!==undefined?8:attack?.projectileLifetime!==undefined?7:attack?.cancelWindows?.some(w=>w.automatic===true)?6:attack?.cancelWindows!==undefined?5:attack?.defenseWindows!==undefined?4:attack?.hitboxGroups!==undefined?3:attack?.hitEvents?2:1;
export const attacksVersion=attacks=>Math.max(1,...attacks.map(attackVersion));
export function requireGroupVersion(version,attacks){
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
