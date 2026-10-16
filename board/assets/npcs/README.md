# Board character animation sources

User-selected PixelLab gallery artwork, October 15, 2026. No student photographs or backups are included.

- host1: gallery:1792110043319, turquoise skirt. Cell column 0, row 1 (64 × 64) from sources/gallery-1792110043319.png. The earlier gallery:1792109814467 was superseded by the user’s selected newer sheet.
- host2: gallery:1791898082408, bun, white shirt, dark trousers. Cell column 0, row 0 from ../attendant/idle.png; companion source gallery:1792109160483 remains in ../attendant/serving.png.
- flyer: gallery:1791911087948, winged unicorn. Cell column 0, row 2 from sources/gallery-1791911087948.png.

The original gallery sheets are retained unchanged. Thirteen movement clips were generated with the user’s existing PixelLab API account from those selected 64-pixel reference cells. Each horizontal atlas contains the returned sequence in order; clips.json records generation job IDs, duration, and frame mapping. PixelLab also retains the resulting assets in the user’s gallery.

Each action starts and finishes with its character’s exact shared *-rest.png reference (restSrc), instead of subtly different generated endpoint colors. Intermediate motion stays in order. Idle and flying loops finish before changing action. Serving and selfies return through their authored recovery frames. No isolated gallery poses are inserted into these clips. Continuous small breathing displacement persists across human animation transitions.

Humans: idle, talk, serve, selfie. Unicorn: fly, land, takeoff, talk, drop. Cells are 64 × 64, transparent, rendered without smoothing. Asset rights/attribution follow the original user-provided PixelLab artwork; these are not represented as public-domain assets.

## Paired interactions, v21

The existing gallery sheets were inspected again through PixelLab. They contain looks, smiles, gestures and individual phone poses, but no complete paired hug or high-five. Five connected paired sequences were therefore generated using PixelLab animate_image (16 generated frames each, 128 × 64). The reference pair-rest.png packs host1-rest.png at x=0 and host2-rest.png at x=64 without changing either source cell. Both people are animated in one frame, preventing independent hands and body movements from drifting apart.

The pair group in clips.json records talk, laugh, hug, highfive and selfie. Exact original pair-rest.png replaces generated first/last endpoints at playback; intermediate frames preserve order. This version adds no new people and does not change source gallery originals.
