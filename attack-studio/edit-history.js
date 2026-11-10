// Bounded workspace snapshots. Explicit gestures stay atomic regardless of time.
export class EditHistory {
 constructor(value,limit=60){this.limit=limit;this.reset(value);}
 reset(value){
  this.current=structuredClone(value);this.past=[];this.future=[];
  this.pastLabels=[];this.futureLabels=[];this.currentLabel='Opened workspace';
  this.key=null;this.time=0;this.transaction=null;
 }
 pushPast(value,label){this.past.push(value);this.pastLabels.push(label);if(this.past.length>this.limit){this.past.shift();this.pastLabels.shift();}}
 record(value,key='',now=Date.now(),label='Edit attack'){
  if(JSON.stringify(value)===JSON.stringify(this.current))return false;
  if(this.transaction){this.current=structuredClone(value);return true;}
  if(!key||key!==this.key||now-this.time>600)this.pushPast(this.current,this.currentLabel);
  this.current=structuredClone(value);this.currentLabel=label;this.future=[];this.futureLabels=[];this.key=key;this.time=now;return true;
 }
 beginTransaction(){
  if(this.transaction)return false;
  this.transaction={before:structuredClone(this.current),key:this.key,time:this.time};return true;
 }
 commitTransaction(label='Move preview object'){
  const transaction=this.transaction;if(!transaction)return false;this.transaction=null;
  if(JSON.stringify(transaction.before)===JSON.stringify(this.current)){this.key=transaction.key;this.time=transaction.time;return false;}
  this.pushPast(transaction.before,this.currentLabel);this.currentLabel=label;
  this.future=[];this.futureLabels=[];this.key=null;this.time=0;return true;
 }
 cancelTransaction(){
  const transaction=this.transaction;if(!transaction)return null;
  this.current=transaction.before;this.key=transaction.key;this.time=transaction.time;this.transaction=null;
  return structuredClone(this.current);
 }
 undo(){
  if(this.transaction)return this.cancelTransaction();if(!this.past.length)return null;
  this.future.push(this.current);this.futureLabels.push(this.currentLabel);
  this.current=this.past.pop();this.currentLabel=this.pastLabels.pop();this.key=null;return structuredClone(this.current);
 }
 redo(){
  if(this.transaction||!this.future.length)return null;
  this.pushPast(this.current,this.currentLabel);this.current=this.future.pop();this.currentLabel=this.futureLabels.pop();this.key=null;return structuredClone(this.current);
 }
 entries(){return [...this.pastLabels,this.currentLabel,...[...this.futureLabels].reverse()].map((label,index)=>({label,index,current:index===this.past.length,future:index>this.past.length}));}
}
