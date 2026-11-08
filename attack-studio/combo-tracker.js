// Read-only combat telemetry: this does not alter damage or reaction balance.
// Call beginFrame after recovery advancement and before any contact resolves.
export class ComboTracker {
 constructor(){this.chains=new Map();}
 beginFrame(frame,states){
  for(const targets of this.chains.values())for(const chain of targets.values()){
   const state=states.get(chain.target);
   if(state?.defeated)this.end(chain,'Defeated');
   else if(!state?.locked)this.end(chain,'Defender regained control');
  }
  this.frame=frame;
 }
 end(chain,reason){if(chain.hits){chain.last={hits:chain.hits,damage:chain.damage,reason};chain.hits=0;chain.damage=0;}}
 recordFrame(contacts){
  // Resolve defensive breaks before counting this frame's eligible hits. Mixed
  // armor/hit groups must not depend on the caller's contact iteration order.
  for(const outcome of ['block','armor'])for(const contact of contacts)if(contact.outcome===outcome)this.contact(contact.attacker,contact.target,contact.outcome,contact.damage);
  for(const contact of contacts)if(contact.outcome==='hit')this.contact(contact.attacker,contact.target,contact.outcome,contact.damage);
 }
 contact(attacker,target,outcome,damage){
  if(attacker===target)return;
  let targets=this.chains.get(attacker);
  // Pair records use a separate map from fighter identity, allowing any owner.
  if(!targets){targets=new Map();this.chains.set(attacker,targets);}
  let chain=targets.get(target);
  if(!chain){chain={attacker,target,hits:0,damage:0,bestHits:0,bestDamage:0,last:null};targets.set(target,chain);}
  if(outcome!=='hit'){this.end(chain,outcome==='armor'?'Armored contact':'Blocked contact');return;}
  chain.hits++;chain.damage+=damage;
  chain.bestHits=Math.max(chain.bestHits,chain.hits);chain.bestDamage=Math.max(chain.bestDamage,chain.damage);
 }
 snapshot(){return [...this.chains.values()].flatMap(targets=>[...targets.values()].map(({attacker,target,...values})=>({attacker,target,...values,last:values.last?{...values.last}:null})));}
 endAll(reason){for(const targets of this.chains.values())for(const chain of targets.values())this.end(chain,reason);}
 clear(){this.chains.clear();}
}
