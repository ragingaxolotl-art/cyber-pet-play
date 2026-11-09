// Runtime-only horizontal reflection. Authored path time keeps advancing;
// reflection mirrors subsequent positions around the current contact center.
// Keep this transform separate from cast origin, timing and remaining lifetime.
export function reflectedProjectileTransform(previous,worldBox){
 const current=previous||{direction:1,offset:0};
 if(!worldBox||![worldBox.x,worldBox.w].every(Number.isFinite)||worldBox.w<=0)throw Error('Reflection needs a finite projectile width and position.');
 if(![1,-1].includes(current.direction)||!Number.isFinite(current.offset))throw Error('Invalid projectile reflection transform.');
 const center=worldBox.x+worldBox.w/2;
 return Object.freeze({direction:-current.direction,offset:2*center-current.offset});
}
export function transformProjectileBox(box,transform){
 if(!transform)return {...box};
 return {...box,x:transform.direction===1?box.x+transform.offset:transform.offset-box.x-box.w,
  facing:(box.facing??1)*transform.direction,...(box.rotation!==undefined?{rotation:box.rotation*transform.direction}:{})};
}
