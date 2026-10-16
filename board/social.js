import {trait,expression,love,travelSpeed,traitFeeling,willing,washThreshold} from './profile.js?v=22';
import {friendship,shareItem} from './sharing.js?v=22';
import {foodScore} from './food.js';
const feeling=(p,emote,seconds=5)=>{p.emote=emote;p.emoteTime=seconds;};
const gap=(a,b)=>(a.bodyWidth??.06)/2+(b.bodyWidth??.06)/2+.018;
export function rememberFavorite(observer,other){
  if(!other.data.food)return;
  observer.knownFavorites??=new Map();observer.knownFavorites.set(other.data.id,other.data.food);
}
export function startGesture(a,b,kind,world){
  world.standBeside(a,b);
  const group={players:[a,b],kind,time:0,resolved:false};
  for(const p of group.players){p.mode='gesture';p.socialGroup=group;p.clock=0;p.socialCooldown=40;p.direction=p===a?Math.sign(b.x-a.x):Math.sign(a.x-b.x);p.displayItem=null;}
  if(kind==='comfort'){feeling(a,'hearts');feeling(b,'frustrated');}
  else {feeling(a,'question');feeling(b,'thinking');if(kind==='offer')a.displayItem=a.heldItem;}
  return group;
}
export function startTogether(a,b,kind,world){
  if(!world.hasAction(a.data,'walking')||!world.hasAction(b.data,'walking')||a.level!==b.level)return false;
  world.standBeside(a,b);
  const speed=Math.min(travelSpeed(a),travelSpeed(b));
  const group={players:[a,b],kind,time:0,duration:8+Math.min(trait(a,'sociability'),trait(b,'sociability'))*12,speed,direction:a.direction||1};
  for(const p of group.players){p.mode=kind;p.socialGroup=group;p.socialCooldown=45;feeling(p,kind==='escort'?'sweat':'hearts',4);}
  if(kind==='escort'){
    const points=[];
    for(let level=a.level;level<2;level++){const s=world.stairs.find(s=>s.from===level);points.push({x:s.a,level},{x:s.b,level:level+1});}
    // Approach from the left so both walk through the full wash.
    points.push({x:world.stations.wash.left-.025,level:2},{x:world.stations.wash.left,level:2});
    group.routes=group.players.map((p,i)=>({pet:p,points:[{x:p.x,level:p.level},...points],segment:0,progress:0,delay:i?(gap(a,b)+Math.abs(a.x-b.x))/speed:0,done:false}));
    a.emote='ok';
  }
  return true;
}
export function trySocial(a,b,world){
  // Comfort and cleaning take precedence over games; neither changes game saves.
  for(const [helper,other] of [[a,b],[b,a]]){
    const generous=expression(helper).giving,care=expression(helper).help;
    if((other.data.stats?.happiness??100)<=35&&!(other.comfortTime>0)&&helper.random()<care*.9){startGesture(helper,other,'comfort',world);return true;}
    if(other.cleanliness<Math.min(.35,washThreshold(other))&&friendship(helper,other)>=50&&helper.random()<care*.35&&startTogether(helper,other,'escort',world))return true;
    if((love(helper)<.5||(helper.data.stats?.fullness??100)>20)&&helper.heldItem&&(!helper.giftFor||helper.giftFor===other.data.id)&&!helper.dislikedGifts?.get(other.data.id)?.has(helper.heldItem.id)&&!other.heldItem&&helper.shareCooldown<=0&&other.shareCooldown<=0&&helper.random()<.05+generous*.8){startGesture(helper,other,'offer',world);return true;}
  }
  if(a.random()<(.2+trait(a,'curiosity')*.35)*(.35+love(a)*.65)){startGesture(a,b,'learn',world);return true;}
  if(friendship(a,b)>=50&&friendship(b,a)>=50&&a.random()<(.15+trait(a,'sociability')*.3)*(.3+love(a)*.7))return startTogether(a,b,'together',world);
  return false;
}
function finish(group){
  for(const p of group.players){if(p.socialGroup!==group)continue;p.socialGroup=null;p.displayItem=null;p.routeFloor=null;if(['gesture','together','escort'].includes(p.mode)){p.mode='idle';p.timer=2;p.clock=0;}p.socialCooldown=35;}
}
export function advanceSocial(pets,dt,world){
  const present=new Set(pets),groups=new Set(pets.map(p=>p.socialGroup).filter(Boolean));
  for(const g of groups){
    if(g.players.some(p=>!present.has(p))){finish(g);continue;}
    const [a,b]=g.players;g.time+=dt;
    if(g.kind==='learn'||g.kind==='offer'||g.kind==='comfort'){
      if(g.time>=2&&!g.resolved){
        g.resolved=true;
        if(g.kind==='learn'){rememberFavorite(a,b);rememberFavorite(b,a);b.displayItem=b.data.food;a.displayItem=a.data.food;feeling(a,'hearts',5);feeling(b,'hearts',5);}
        if(g.kind==='comfort'){b.comfortTime=70;feeling(b,'cute',5);feeling(a,'hearts',5);b.friendships??=new Map();b.friendships.set(a.data.id,Math.min(100,friendship(b,a)+2));}
        if(g.kind==='offer'){feeling(b,foodScore(a.heldItem,b.data.foodPreferences)<=0?(love(b)>.5?'thinking':'frustrated'):'hearts',5);}
      }
      if(g.kind==='offer'&&g.time>=4&&!g.transferred){g.transferred=true;const result=shareItem(a,b);if(result){if(result.reaction==='disliked'){a.dislikedGifts??=new Map();if(!a.dislikedGifts.has(b.data.id))a.dislikedGifts.set(b.data.id,new Set());a.dislikedGifts.get(b.data.id).add(result.item.id);}a.displayItem=result.item;feeling(a,result.reaction==='disliked'?(love(a)>.5?'thinking':traitFeeling(a,'generosity')):'hearts',3);feeling(b,result.reaction==='disliked'?(love(b)>.5?'thinking':'frustrated'):'hearts',3);}}
      if(g.time>=7)finish(g);
    }else if(g.kind==='together'){
      if(!g.players.every(p=>world.hasAction(p.data,'walking'))){finish(g);continue;}
      if(Math.min(a.x,b.x)<.05||Math.max(a.x,b.x)>.95)g.direction*=-1;
      for(const p of g.players){p.direction=g.direction;p.x+=g.direction*g.speed*dt;world.addWalkingDirt(p,g.speed*dt);}
      if(g.time>=g.duration)finish(g);
    }else if(g.kind==='escort'){
      if(!g.players.every(p=>world.hasAction(p.data,'walking'))){finish(g);continue;}
      for(const route of g.routes){
        if(route.done||g.time<route.delay)continue;
        const p=route.pet,from=route.points[route.segment],to=route.points[route.segment+1];
        const length=Math.hypot(to.x-from.x,(to.level-from.level)*.255)||.001;
        route.progress=Math.min(1,route.progress+g.speed*dt/length);
        p.direction=Math.sign(to.x-from.x)||1;p.x=from.x+(to.x-from.x)*route.progress;
        p.routeFloor=world.floor(from.level)+(world.floor(to.level)-world.floor(from.level))*route.progress;
        world.addWalkingDirt(p,g.speed*dt);
        if(route.progress===1){p.level=to.level;route.segment++;route.progress=0;
          if(route.segment===route.points.length-1){route.done=true;p.routeFloor=null;p.mode='wash';p.direction=1;p.washProgress=0;p.washStartCleanliness=p.cleanliness;p.clock=0;feeling(p,'ok',4);}
        }
      }
      if(g.routes.every(r=>r.done))finish(g);
    }
  }
}
