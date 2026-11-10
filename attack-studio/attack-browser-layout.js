// Controls move into task-specific dialogs; they never compete with the artwork grid for height.
export function installFinderLayout({dialog,toolbar,preview,body,pager,filters,results,headingRow}) {
 const make=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
 const windows=[];
 function toolWindow(title){const window=make('dialog'),header=make('div'),heading=make('h2',title),close=make('button','Back to attacks'),content=make('div'),open=make('button',title);window.className='attack-browser-tool-window';window.setAttribute('aria-label',title);header.className='attack-browser-heading';header.append(heading,close);window.append(header,content);document.body.append(window);toolbar.append(open);open.type=close.type='button';open.onclick=()=>window.showModal();close.onclick=()=>window.close();window.addEventListener('close',()=>open.focus());windows.push(window);return {window,content};}
 const filterWindow=toolWindow('Filters');filterWindow.content.className='attack-browser-tool-filters';
 for(const [key,field]of Object.entries(filters))if(key!=='query'&&key!=='size')filterWindow.content.append(field.closest('label'));
 const library=toolbar.querySelector('.attack-browser-library'),libraryWindow=toolWindow('Collections & saved searches');
 if(library){library.open=true;libraryWindow.content.append(library);}
 for(const button of [...toolbar.querySelectorAll('button')])if(button.textContent==='Clear filters'||button.textContent==='Refresh saved attacks')filterWindow.content.append(button);
 const showPreview=make('button','Hide preview'),expand=make('button','Fill screen'),reset=make('button','Reset finder size');showPreview.type=expand.type=reset.type='button';
 toolbar.append(showPreview);headingRow.append(expand,reset);
 showPreview.setAttribute('aria-pressed','true');showPreview.onclick=()=>{const hidden=!preview.hidden;preview.hidden=hidden;dialog.classList.toggle('attack-browser-gallery-only',hidden);showPreview.textContent=hidden?'Show preview':'Hide preview';showPreview.setAttribute('aria-pressed',String(!hidden));};
 expand.onclick=()=>{const expanded=dialog.classList.toggle('attack-browser-expanded');expand.textContent=expanded?'Restore window':'Fill screen';dialog.style.width='';dialog.style.height='';};
 reset.onclick=()=>{dialog.style.width='';dialog.style.height='';dialog.classList.remove('attack-browser-expanded');expand.textContent='Fill screen';body.style.setProperty('--attack-preview-width','30%');previewWidth.value=30;};
 const sizeWindow=toolWindow('Window sizes'),previewWidth=make('input'),label=make('label','Preview pane width');previewWidth.type='range';previewWidth.min=20;previewWidth.max=50;previewWidth.value=30;previewWidth.setAttribute('aria-label','Preview pane width');label.append(previewWidth);sizeWindow.content.append(make('p','Drag the lower-right corner of this finder or a tools window to resize it. Fill screen gives the images the largest available area.'),label);
 previewWidth.oninput=()=>body.style.setProperty('--attack-preview-width',previewWidth.value+'%');
 for(const [property,title,min,max]of [['width','Finder width',45,98],['height','Finder height',60,98]]){const label=make('label',title),input=make('input');input.type='range';input.min=min;input.max=max;input.value=property==='width'?96:94;input.setAttribute('aria-label',title);input.oninput=()=>{dialog.classList.remove('attack-browser-expanded');expand.textContent='Fill screen';dialog.style[property]=input.value+(property==='width'?'vw':'dvh');};label.append(input);sizeWindow.content.append(label);}
 pager.className='attack-browser-pagination';pager.prepend(results);
 const closeTools=()=>windows.forEach(window=>{if(window.open)window.close();});dialog.addEventListener('close',closeTools);dialog.addEventListener('cancel',closeTools);
 return {closeTools};
}
