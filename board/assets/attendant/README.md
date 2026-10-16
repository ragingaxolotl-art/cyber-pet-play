# Food-house attendant sprite mapping

User-supplied PixelLab artwork, copied unchanged with permission on October 15, 2026.
Originals (not student profiles or saves):
- serving.png: /Users/timetravellog/Documents/pixellab-I-want-the-girl--in-the-refere-1792109160483.png
- idle.png: /Users/timetravellog/Documents/pixellab-A-girl-using-only-10-colors--1791898082408.png

Both atlases: 256×256 transparent PNG, sixteen 64×64 cells. Rows/columns below are one-based. Runtime mapping, pivots and seconds are in counter.js.

| Purpose | Sheet | Cells |
| --- | --- | --- |
| Restrained idle weight shift | idle | R1C1 → R1C2 → R1C1, separated by long holds |
| Turn toward tray | serving then idle | R2C1 (three-quarter), R3C1 (profile) |
| Serve and recover | serving | R1C1 → R1C2 → R1C3 → R1C2 → R1C1 |
| Return to idle | idle then serving | R3C1 → R2C1 → idle R1C1 |

Counter hides lower-body stepping differences. Horizontal pivots stabilize torso position; no crossfading, generated tween artwork, or automatic row cycling. Original tray artwork contains a small generic food prop; the customer's real favorite-food sprite is delivered from it. Idle/front and serving/profile clips use authored turning poses in both directions. Excluded: back-facing sequences, opposite-facing last columns, sitting/cheering, phone and isolated gestures without suitable entry/exit frames. The source does not contain a full fluid animation for every pose.

Food orders queue per pet in session. Meals begin on handoff, and absent artwork falls back to immediate service. The attendant is scenery, never a saved/class pet.
