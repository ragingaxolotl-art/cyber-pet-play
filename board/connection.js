import {isClassPet} from './profile.js?v=30';
// Only this read-only, random display credential is remembered, never the teacher password.
const KEY='cyber-pet-board.connection.v1';
export function rememberConnection(storage,connection){storage.setItem(KEY,JSON.stringify(connection));}
export function forgetConnection(storage){storage.removeItem(KEY);}
export function readConnection(storage,now=Date.now()){
  try{const c=JSON.parse(storage.getItem(KEY));return /^[a-f0-9]{64}$/.test(c?.token)&&Number.isFinite(c.expires)&&c.expires*1000>now?c:null;}catch{return null;}
}
// Reuse decoded artwork and retain the last good version if an individual update fails.
export async function refreshRoster(items,current,read){
  const old=new Map(current.filter(p=>p.boardId).map(p=>[p.boardId,p])),next=[],failures=[];
  let pixels=0;
  for(const item of items.filter(isClassPet)){
    const previous=old.get(item.id);let pet;
    try{
      pet=previous?.backupHash===item.sha256&&(previous?.projectionRevision??0)===(item.projectionRevision??0)?previous:await read(item);
      if(!isClassPet(pet)){if(pet!==previous)for(const img of pet.images.values())img.close?.();continue;}
      if(pixels+(pet.pixels||0)>100000000){if(pet!==previous)for(const img of pet.images.values())img.close?.();throw Error('Board memory limit reached.');}
      pet.boardId=item.id;pet.backupHash=item.sha256;pet.projectionRevision=item.projectionRevision??0;
    }catch(error){failures.push(`${item.name||'Pet'}: ${error.message}`);pet=previous;}
    if(pet){pixels+=pet.pixels||0;next.push(pet);}
  }
  return {pets:next,failures};
}
