// Bounded snapshots. A property drag/typing burst is one reversible operation.
export class EditHistory {
  constructor(value,limit=60){this.limit=limit;this.reset(value);}
  reset(value){this.current=structuredClone(value);this.past=[];this.future=[];this.key=null;this.time=0;}
  record(value,key='',now=Date.now()){
    if(JSON.stringify(value)===JSON.stringify(this.current))return false;
    if(!key||key!==this.key||now-this.time>600){this.past.push(this.current);if(this.past.length>this.limit)this.past.shift();}
    this.current=structuredClone(value);this.future=[];this.key=key;this.time=now;return true;
  }
  undo(){if(!this.past.length)return null;this.future.push(this.current);this.current=this.past.pop();this.key=null;return structuredClone(this.current);}
  redo(){if(!this.future.length)return null;this.past.push(this.current);this.current=this.future.pop();this.key=null;return structuredClone(this.current);}
}
