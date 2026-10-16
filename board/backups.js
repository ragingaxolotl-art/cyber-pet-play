import {boardActions,aliases} from './pet-animation.js?v=31';
// Read the existing Godot PetSnapshot ZIP format entirely in browser memory.
export const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
const decode=bytes=>new TextDecoder('utf-8',{fatal:true}).decode(bytes);
const MAX_FILE=8*1024*1024;
export async function readBackup(buffer,expectedHash){
  if(buffer.byteLength>32*1024*1024 || buffer.byteLength<22)throw Error('Backup must be a Cyber Pet ZIP under 32 MiB.');
  if(expectedHash && await hash(buffer)!==expectedHash)throw Error('Backup download checksum did not match.');
  const v=new DataView(buffer),bytes=new Uint8Array(buffer);let end=-1;
  for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(v.getUint32(i,true)===0x06054b50 && i+22+v.getUint16(i+20,true)===bytes.length){end=i;break;}
  if(end<0)throw Error('ZIP directory is missing.');
  const count=v.getUint16(end+10,true),size=v.getUint32(end+12,true);let offset=v.getUint32(end+16,true);
  if(v.getUint16(end+4,true)||v.getUint16(end+6,true)||v.getUint16(end+8,true)!==count||count<3||count>4096||offset+size!==end)throw Error('Unsupported ZIP layout.');
  const files=new Map();let total=0;const directory=offset;
  for(let i=0;i<count;i++){
    if(offset+46>end||v.getUint32(offset,true)!==0x02014b50)throw Error('Invalid ZIP directory.');
    const flags=v.getUint16(offset+8,true),method=v.getUint16(offset+10,true),compressed=v.getUint32(offset+20,true),length=v.getUint32(offset+24,true),n=v.getUint16(offset+28,true),extra=v.getUint16(offset+30,true),comment=v.getUint16(offset+32,true),local=v.getUint32(offset+42,true);
    if(offset+46+n+extra+comment>end||!n||n>255)throw Error('Invalid ZIP filename.');
    const name=decode(bytes.slice(offset+46,offset+46+n));total+=length;
    if(flags&1||![0,8].includes(method)||length>MAX_FILE||compressed>MAX_FILE+65536||total>128*1024*1024||local+30>directory||v.getUint32(local,true)!==0x04034b50||v.getUint16(offset+34,true))throw Error('Unsupported or oversized ZIP entry.');
    if(!/^(snapshot\.json|config\.json|progress\.json|[^\\/:\x00]+\.png)$/.test(name)||name.includes('..')||files.has(name.toLowerCase()))throw Error('Unsafe or duplicate ZIP entry.');
    const localName=v.getUint16(local+26,true),localExtra=v.getUint16(local+28,true),start=local+30+localName+localExtra;
    if(start+compressed>directory||decode(bytes.slice(local+30,local+30+localName))!==name||v.getUint16(local+8,true)!==method)throw Error('ZIP entry does not match directory.');
    files.set(name.toLowerCase(),{name,start,compressed,length,method});offset+=46+n+extra+comment;
  }
  if(offset!==end)throw Error('ZIP directory size is inconsistent.');
  const extract=async name=>{
    const f=files.get(name.toLowerCase());if(!f||f.name!==name)throw Error('Missing backup file: '+name);
    let result=bytes.slice(f.start,f.start+f.compressed);
    if(f.method===8){
      const reader=new Blob([result]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();const chunks=[];let read=0;
      for(;;){const {value,done}=await reader.read();if(done)break;read+=value.length;if(read>f.length||read>MAX_FILE){await reader.cancel();throw Error('Expanded image exceeds its limit.');}chunks.push(value);}
      result=new Uint8Array(read);let position=0;for(const chunk of chunks){result.set(chunk,position);position+=chunk.length;}
    }
    if(result.length!==f.length)throw Error('Incomplete ZIP file.');return result;
  };
  const manifest=JSON.parse(decode(await extract('snapshot.json')));
  if(manifest.schema_version!==1||!manifest.files||typeof manifest.character_id!=='string')throw Error('Not a Cyber Pet snapshot.');
  const verified=async name=>{const data=await extract(name);if(await hash(data)!==manifest.files[name])throw Error('Backup file checksum did not match: '+name);return data;};
  const config=JSON.parse(decode(await verified('config.json'))), progress=JSON.parse(decode(await verified('progress.json')));
  if(!config.animations||!aliases.idle.some(a=>Array.isArray(config.animations[a])&&config.animations[a].length))throw Error('This pet has no idle artwork.');
  const images=new Map(),sourceScales=new Map();let pixels=0,sourcePixels=0;
  try{
    for(const action of boardActions){
      const frames=config.animations[action];if(!frames)continue;
      if(!Array.isArray(frames)||frames.length>256)throw Error('Animation has too many frames for the board.');
      for(const name of frames){
        if(typeof name!=='string'||!name.endsWith('.png'))throw Error('Expected exported PNG artwork.');
        if(images.has(name))continue;
        const data=await verified(name),p=new DataView(data.buffer,data.byteOffset,data.byteLength);
        if(data.length<24||p.getUint32(0)!==0x89504e47||p.getUint32(4)!==0x0d0a1a0a)throw Error('Invalid PNG artwork.');
        const w=p.getUint32(16),h=p.getUint32(20);sourcePixels+=w*h;
        if(!w||!h||w>4096||h>4096||sourcePixels>128000000)throw Error('Artwork is too large for the board.');
        const ratio=Math.min(1,320/Math.max(w,h)),rw=Math.max(1,Math.round(w*ratio)),rh=Math.max(1,Math.round(h*ratio));pixels+=rw*rh;
        if(pixels>24000000)throw Error('Animation memory limit reached.');
        sourceScales.set(name,{x:w/rw,y:h/rh});
        images.set(name,await createImageBitmap(new Blob([data],{type:'image/png'}),{resizeWidth:rw,resizeHeight:rh,resizeQuality:'high'}));
      }
    }
    const cleanliness=Number(progress.stats?.cleanliness);
    return {id:manifest.character_id,name:String(config.name||'Cyber Pet').slice(0,60),config,images,sourceScales,stats:progress.stats||{},speed:progress.skills?.levels?.speed,love:progress.bond?.love,personality:progress.personality||config.starter_traits?.personality||{},foodPreferences:progress.food_preferences||config.starter_traits?.food_preferences||{},cleanliness:Number.isFinite(cleanliness)?Math.max(0,Math.min(1,cleanliness/100)):.35,pixels};
  }catch(error){for(const image of images.values())image.close?.();throw error;}
}
