// Permanent board residents, distinct from uploaded test-character backups.
export const companionNames=['Fern','Echo','Moss','Nova'];
export function createCompanions(config,images,random=Math.random){
 const tastes=['Sweet','Salty','Sour','Bitter','Savory'];
 return companionNames.map((name,i)=>({id:'companion-'+name.toLowerCase(),isCompanion:true,name,config,images,tint:[65,145,225,300][i],love:75,speed:20+i*12,cleanliness:.8,
 foodPreferences:{favorite_taste:tastes[Math.floor(random()*tastes.length)],favorite_food_tags:['Fresh','Fruity','Roasted'],hated_food_tags:['Fermented','Charred']},
 personality:Object.fromEntries(['activity_level','curiosity','sociability','generosity','bravery','assertiveness'].map(key=>[key,15+random()*70]))}));
}
export function withResidents(classPets,residents){return [...classPets.filter(p=>!p.isCompanion),...residents];}
