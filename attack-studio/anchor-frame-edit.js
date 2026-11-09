// Map sequence positions, not source image numbers: repeated images may have
// different anchors. Copies receive new IDs and independent point objects.
export function remapAnchorFrames(frames, positions) {
 if (!Array.isArray(positions) || !positions.length || positions.length > 300 ||
     positions.some(index => !Number.isInteger(index) || index < 0 || index >= frames.length))
  throw Error('Choose valid anchor frame positions.');
 const used = new Set(), reserved = new Set(frames.map(frame => frame.id));
 return positions.map(index => {
  const frame = structuredClone(frames[index]);
  if (used.has(frame.id)) {
   const stem = frame.id.slice(0,65); let suffix = 1;
   while (reserved.has(`${stem}_copy${suffix}`)) suffix++;
   frame.id = `${stem}_copy${suffix}`; reserved.add(frame.id);
  }
  used.add(frame.id); return frame;
 });
}

// Hurtboxes have no cross-frame IDs; copy their full geometry independently.
export function remapHurtboxFrames(frames, positions) {
 if (!Array.isArray(positions)||!positions.length||positions.length>300||
     positions.some(index=>!Number.isInteger(index)||index<0||index>=frames.length))
  throw Error('Choose valid hurtbox frame positions.');
 return positions.map(index=>structuredClone(frames[index]));
}
