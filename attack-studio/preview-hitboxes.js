import {worldBox} from './combat-model.js';

// Collision samples contain only active boxes. Keep the selected authored box
// editable outside its window without adding it to the combat simulation.
export function editablePreviewBoxes(attack,sample,frame,stats,facing,selected,editing){
 if(!attack.hitboxGroups)return null;
 const boxes=sample.boxes||[];
 if(!editing||boxes.some(box=>box.boxId===selected))return boxes;
 const group=attack.hitboxGroups.find(group=>group.boxes.some(box=>box.id===selected));
 const authored=group?.boxes.find(box=>box.id===selected);if(!authored)return boxes;
 const base=worldBox(attack,frame,stats,facing),world=worldBox({...attack,box:authored},frame,stats,facing);
 return [...boxes,{...world,x:world.x+sample.box.x-base.x,y:world.y+sample.box.y-base.y,groupId:group.id,boxId:authored.id,editorOnly:true}];
}
