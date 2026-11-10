// Resolve the same defaults shown by the editor before taking a history snapshot.
// Rendering must not turn an Undo into a new edit that erases Redo.
export function applyEditorDefaults(attack,effects) {
 if(!attack)return;
 attack.impactTrigger??='timed';
 attack.poseImpact??=0;
 attack.box.shape??='rectangle';
 attack.pathDuration??=60;
 for(const visual of attack.visuals) {
  const effect=effects.get(visual.effectId);
  visual.loop??=!!effect?.loop;
  visual.fadeOutFrames??=0;
  visual.stretchX??=1;
  visual.stretchY??=1;
  visual.forwardAngle??=0;
  visual.followPath??=false;
  visual.loopUntilImpact??=false;
  visual.loopStart??=1;
  visual.loopEnd??=(visual.frames?.length||effect?.times.length||1);
 }
}
