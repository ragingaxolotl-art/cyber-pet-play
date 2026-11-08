// Omitted policy preserves existing repeated-contact behavior.
export function validateProjectileContact(attack){
 if(attack.projectileContact===undefined)return;
 if(!['single','repeat'].includes(attack.projectileContact))throw Error('Choose single or repeated projectile contact.');
 if(attack.delivery!=='projectile'||attack.projectileLifetime===undefined||!['damage','push'].includes(attack.payload))throw Error('Projectile contact policy requires an independent damage or push projectile.');
}
export const consumesProjectile=(attack,outcome)=>attack.projectileContact==='single'&&['hit','block','armor'].includes(outcome);
export const CONTACT_END_REASON='Projectile ended after its first successful contact.';
