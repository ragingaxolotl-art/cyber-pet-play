// Reuses the game's 32×32 emote atlas rules (scripts/game/emote_art.gd).
const groups=['laughing','thinking','question','eager','cute','silence','drooling','sleepy','frustrated','sweat','crying','neutral','ok','love'];
const sequences=new Map();
async function loadImage(path){const image=new Image();image.src=path;await image.decode();return image;}
export async function loadEmotes(){
  await Promise.allSettled(groups.map(async group=>{
    const image=await loadImage(`assets/emotes/${group}.png`),surface=document.createElement('canvas');surface.width=image.width;surface.height=image.height;
    const c=surface.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);const pixels=c.getImageData(0,0,image.width,image.height).data,frames=[];
    for(let y=0;y<image.height;y+=32)for(let x=0;x<image.width;x+=32){
      let left=32,right=-1,top=32,bottom=-1;
      for(let yy=0;yy<32&&y+yy<image.height;yy++)for(let xx=0;xx<32&&x+xx<image.width;xx++)if(pixels[((y+yy)*image.width+x+xx)*4+3]>0){left=Math.min(left,xx);right=Math.max(right,xx);top=Math.min(top,yy);bottom=Math.max(bottom,yy);}
      const w=right-left+1,h=bottom-top+1;if(w*h>=180)frames.push({image,x:x+left,y:y+top,w,h});
    }
    if(frames.length)sequences.set(group,frames);
  }));
  const hearts=await Promise.all(Array.from({length:8},async(_,i)=>{const image=await loadImage(`assets/emotes/hearts_${i}.png`);return {image,x:0,y:0,w:image.width,h:image.height};}));sequences.set('hearts',hearts);
}
export function drawFeeling(c,group,seconds,x,y,size){
  const frames=sequences.get(group);if(!frames?.length)return false;
  const f=frames[Math.floor(seconds*(group==='hearts'?12:8))%frames.length],scale=size/Math.max(f.w,f.h);
  c.save();c.imageSmoothingEnabled=false;c.drawImage(f.image,f.x,f.y,f.w,f.h,x-f.w*scale/2,y-f.h*scale/2,f.w*scale,f.h*scale);c.restore();return true;
}
export const feelingFallback={eager:'!',hearts:'♡',love:'♡',cute:'☺',question:'?',thinking:'…',laughing:'♫',ok:'✓',sleepy:'Zz',drooling:'Yum',frustrated:'…',crying:'…'};
