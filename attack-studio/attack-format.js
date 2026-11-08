// Container versions protect combat behavior from silent loss in older clients.
export const attackVersion=attack=>attack?.cancelWindows?.some(w=>w.automatic===true)?6:attack?.cancelWindows!==undefined?5:attack?.defenseWindows!==undefined?4:attack?.hitboxGroups!==undefined?3:attack?.hitEvents?2:1;
export const attacksVersion=attacks=>Math.max(1,...attacks.map(attackVersion));
export function requireGroupVersion(version,attacks){
 if(version<6&&attacks.some(a=>a?.cancelWindows?.some(w=>w.automatic===true)))throw Error('Automatic follow-ups require a version 6 file.');
 if(version<5&&attacks.some(a=>a?.cancelWindows!==undefined))throw Error('Cancel windows require a version 5 file.');
 if(version<4&&attacks.some(a=>a?.defenseWindows!==undefined))throw Error('Defense windows require a version 4 file.');
 if(version<3&&attacks.some(a=>a?.hitboxGroups!==undefined))throw Error('Multiple hitboxes require a version 3 file.');
}
