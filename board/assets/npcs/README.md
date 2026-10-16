# Board character animation sources

User-selected PixelLab gallery artwork, October 15, 2026. No student photographs or backups are included.

- host1: gallery:1792110043319, turquoise skirt. Cell column 0, row 1 (64 × 64) from sources/gallery-1792110043319.png. The earlier gallery:1792109814467 was superseded by the user’s selected newer sheet.
- host2: gallery:1791898082408, bun, white shirt, dark trousers. Cell column 0, row 0 from ../attendant/idle.png; companion source gallery:1792109160483 remains in ../attendant/serving.png.
- flyer: gallery:1791911087948, winged unicorn. Cell column 0, row 2 from sources/gallery-1791911087948.png.

The original gallery sheets are retained unchanged. Thirteen movement clips were generated with the user’s existing PixelLab API account from those selected 64-pixel reference cells. Each horizontal atlas contains the returned sequence in order; clips.json records generation job IDs, duration, and frame mapping. PixelLab also retains the resulting assets in the user’s gallery.

Each action starts and finishes with its character’s exact shared *-rest.png reference (restSrc), instead of subtly different generated endpoint colors. Intermediate motion stays in order. Idle and flying loops finish before changing action. Serving and selfies return through their authored recovery frames. No isolated gallery poses are inserted into these clips. Continuous small breathing displacement persists across human animation transitions.

Humans: idle, talk, serve, selfie. Unicorn: fly, land, takeoff, talk, drop. Cells are 64 × 64, transparent, rendered without smoothing. Asset rights/attribution follow the original user-provided PixelLab artwork; these are not represented as public-domain assets.
