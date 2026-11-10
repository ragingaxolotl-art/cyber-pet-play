import {treeCloud} from './tree-cloud.js?v=20261110-tree-classroom-recovery';
export function installTreeClassroom({getRelease,importRelease}) {
 const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
 const classroom=el('button','Classroom releases');document.querySelector('header nav').append(classroom);
 classroom.onclick=()=>{
  const dialog=el('dialog'),heading=el('h2','Classroom tree releases'),label=el('label','Teacher password'),password=el('input'),connect=el('button','Connect'),refresh=el('button','Refresh releases'),publish=el('button','Publish reviewed local release'),load=el('button','Import selected classroom data set'),picker=el('select'),message=el('p','Publish data set first to create a reviewed local release.'),close=el('button','Close');
  password.type='password';password.autocomplete='current-password';label.append(password);picker.setAttribute('aria-label','Classroom data set');message.setAttribute('role','status');
  const client=treeCloud();let items=[],active=true,busy=false,connected=false;
  const controls=()=>{
   connect.disabled=busy||connected;password.disabled=busy||connected;
   refresh.disabled=publish.disabled=busy||!connected;
   picker.disabled=load.disabled=busy||!connected||!items.length;
  };
  const fill=(selected=items[Number(picker.value)]?.release?.publication?.id)=>{
   picker.replaceChildren(...items.map((item,i)=>new Option(item.release.name+' · revision '+item.revision,String(i))));
   const index=items.findIndex(item=>item.release.publication?.id===selected);if(index>=0)picker.value=String(index);
  };
  const read=async()=>{
   const value=await client.read();if(!active)return;
   if(!Array.isArray(value?.items)||value.items.some(item=>!item?.release||typeof item.release.name!=='string'))throw Error('Classroom returned an invalid release list. Refresh releases to try again.');
   const selected=items[Number(picker.value)]?.release?.publication?.id;items=value.items;fill(selected);
  };
  const run=async action=>{
   if(!active||busy)return;busy=true;controls();
   try {await action();}catch(error){if(active)message.textContent=error.message;}
   finally {busy=false;if(active)controls();}
  };
  connect.onclick=()=>run(async()=>{
   const value=password.value;password.value='';await client.connect(value);if(!active)return;
   connected=true;await read();if(active)message.textContent='Connected. Publishing makes the reviewed data set available to signed-in classroom accounts.';
  });
  refresh.onclick=()=>run(async()=>{await read();if(active)message.textContent='Refreshed classroom releases.';});
  publish.onclick=()=>run(async()=>{
   const release=await getRelease();if(!active)return;
   if(!release)throw Error('Use Publish data set to create a reviewed release first.');
   const existing=items.find(item=>item.release.publication?.id===release.publication.id);
   const result=await client.save(release,existing?.revision||0);if(!active)return;
   const success='Published '+release.name+' to the classroom · revision '+result.revision;
   // Remember the committed revision even if the subsequent list request fails.
   const entry={release,revision:result.revision};if(existing)items[items.indexOf(existing)]=entry;else items.push(entry);fill();
   message.textContent=success;
   try {await read();}catch(error){if(active)message.textContent=success+'. Could not refresh releases: '+error.message+' Use Refresh releases to retry.';}
  });
  load.onclick=()=>run(async()=>{
   const item=items[Number(picker.value)];if(!item)throw Error('Choose a data set.');
   await importRelease(item.release);if(active)message.textContent='Imported classroom data set as an independent local copy.';
  });
  const dispose=()=>{
   if(!active)return;active=false;password.value='';client.close().catch(()=>{});dialog.remove();classroom.focus();
  };
  close.onclick=()=>dialog.close();dialog.addEventListener('close',dispose);
  dialog.addEventListener('cancel',event=>{event.preventDefault();dialog.close();});
  dialog.append(heading,label,connect,refresh,picker,publish,load,message,close);document.body.append(dialog);controls();dialog.showModal();
 };
}
