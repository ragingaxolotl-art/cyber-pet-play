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

## Walking and exact gallery poses, v22

Eight PixelLab API clips (64 × 64, eight generated frames each) add two relaxed sideways step cycles and six entrances to original gallery poses. Gallery coordinates below are zero-based columns/rows, each cell 64 × 64:

- host1-look: gallery:1792110043319, column 1 row 1.
- host1-hair: same sheet, column 1 row 3.
- host1-delight: same sheet, column 3 row 1.
- host2-look: gallery:1792109160483 (../attendant/serving.png), column 1 row 1.
- host2-wave: gallery:1791898082408 (../attendant/idle.png), column 3 row 3.
- host2-phone: same idle sheet, column 1 row 3.

The *-target.png cells are copied exactly from those gallery sheets. Manifest targetSrc/targetFrame pins the peak pose to that exact source image. frames maps the generated entrance, a short target hold, and its reverse return; count is playback-frame count while atlasCount is the stored image count. Walking loops share the original resting cell at either end; no source gallery sheet was changed. Generation job IDs are retained per clip.

## Leaning, blink timing and independent ball, v23

Four additional PixelLab API generations retain the user-selected identities. host1-lean reaches gallery:1792110043319 column 3 row 2; host2-lean reaches gallery:1792109160483 column 3 row 1. Exact gallery targets replace the peak frame; reverse entrance frames return smoothly to the exact original rest cell. Leaning occurs both at the counter and during alternating walks. The previous white-shirt idle remains available as an occasional sleepy break; host2-blink is the separate quick blink loop with 2.8 seconds of open-eye rest.

clips.json frameDurations separates deliberate holds from 8.33 fps gestures and 10 fps walking. Serving keeps its 3.2-second customer window and 1.65-second food handoff, with a held offer pose. Sleep intentionally remains slower. New flyer-toss has an empty hoof: toys.js draws the ball independently across the sprite boundary, anchors it to the hoof, then releases its bouncing trajectory. The toy-ball.svg is original simple vector artwork matching the independent canvas ball; it is a session-only item for pickup and sharing, excluded from eating. Original atlases are retained unchanged.

## Full-profile walking and turns, v24

Four PixelLab API clips replace the sideways front-facing walks: host1-turn (1739b11f-327b-4299-b71f-1571290ed9b9), host1-profile-walk (e666d692-dbb9-4cdb-b9fe-35066c36fb90), host2-turn (500fe4b0-ddc9-4fc6-be20-3dcbbdfc1406), host2-profile-walk (c1a5e9ef-2488-473d-bbb6-861c27a536e4). White-shirt profile is the original gallery:1791898082408 column 1 row 2; turquoise profile is the final frame of the turn generated from her selected gallery rest cell. Exact profile endpoints bridge the 10 fps walk loops. Rendering mirrors only profile travel/turns when facing left; walk frames always play forward. Four turn/recovery phases connect home rest, outward walking, gallery pose, return walking and home rest. Previous source atlases are retained for provenance.
