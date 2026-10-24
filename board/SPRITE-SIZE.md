# Stable sprite size — release 41

The board uses the median opaque width and height of the character's idle animation as a reference. It corrects a clip or isolated frame when height differs by more than 35% and its width changes by approximately the same factor (aspect-ratio tolerance 25%). Correction is uniform in both axes and limited to 1/8–8 times. This targets apparent zooming caused by mismatched artwork sizes, rather than stretching the image.

Normal breathing and small size changes remain authored. Squatting, stretching, lying down and extended poses that change proportions are not normalized. Corrected clips retain their frame-to-frame foot lift and sideways movement, and their resting feet align with the reference baseline. Source image downsampling is accounted for before comparing sizes. Blank transparent frames do not inflate the character envelope. The board's existing crowd-size and screen-size limits are applied after normalization, so one oversized clip no longer shrinks all the other matching poses.

This is a conservative visual heuristic, not body-part detection: similarly proportioned intentional shrink/grow animations may also be stabilized, while differently proportioned mismatched drawings may need artwork adjustment. Character PNGs, authored display settings and saved gameplay data are not rewritten. On refresh, new artwork is measured again.
