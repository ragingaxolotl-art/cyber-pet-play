// Container versions protect combat behavior from silent loss in older clients.
export const attackVersion=attack=>attack?.hitboxGroups!==undefined?3:attack?.hitEvents?2:1;
export const attacksVersion=attacks=>Math.max(1,...attacks.map(attackVersion));
export function requireGroupVersion(version,attacks){
 if(version<3&&attacks.some(a=>a?.hitboxGroups!==undefined))throw Error('Multiple hitboxes require a version 3 file.');
}
