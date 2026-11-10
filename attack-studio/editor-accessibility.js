const KEY='cyber-pet-editor-accessibility-v1';
export function installAccessibility(container){
 let settings;try{settings=JSON.parse(localStorage.getItem(KEY)||'{}');}catch{settings={};}if(!settings||typeof settings!=='object')settings={};
 const make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
 function toggle(key,title){const label=make('label'),box=make('input');box.type='checkbox';box.checked=settings[key]===true;label.append(box,document.createTextNode(title));container.append(label);box.onchange=()=>{settings[key]=box.checked;apply();try{localStorage.setItem(KEY,JSON.stringify(settings));}catch{}};}
 function apply(){document.body.classList.toggle('editor-compact',settings.density!=='comfortable');document.body.classList.toggle('editor-large-controls',settings.controls===true);document.body.classList.toggle('editor-large-text',settings.text===true);}
 const densityLabel=make('label','Control spacing'),density=make('select');density.setAttribute('aria-label','Control spacing');density.add(new Option('Compact','compact'));density.add(new Option('Comfortable','comfortable'));density.value=settings.density==='comfortable'?'comfortable':'compact';density.onchange=()=>{settings.density=density.value;apply();try{localStorage.setItem(KEY,JSON.stringify(settings));}catch{}};densityLabel.append(density);container.append(densityLabel);
 toggle('controls','Larger buttons and controls');toggle('text','Larger text');apply();
}
