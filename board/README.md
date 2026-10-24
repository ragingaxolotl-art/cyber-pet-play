# Cyber Pet Board

Ambient classroom display. Automatically loads every character’s latest website backup without a password, setup link, or local credential. Checks for new uploads every minute. Local exported ZIPs also work. Characters without decoded walking artwork stay in place and emote.

Three full-width levels, optional two-way stair traversal, same-level screen wrapping, occasional idle/emote pauses, and personality-weighted speed, curiosity and emotes. A jungle food house uses saved food tastes and rotating favorite tags; eating requires decoded eat frames. A cloud wash cleans pets visually as they walk through. Neither activity changes saved care stats. No care decay, rewards, collisions, or student controls. Full screen hides chrome; Escape returns and Space pauses. Reduced-motion preference starts paused.

`dist/motion.js` contains adjustable timing and stairs. `dist/backups.js` reads the existing flat Godot PetSnapshot archive, validates hashes, and bounds decompression and image memory. The scene keeps all loaded pets in one display. Load errors remain visible in teacher setup. Large classes may require smaller exported artwork to fit browser memory.

Sources copied from `/Volumes/Cyber Pet Workspace/CPP-V3`: `assets/pets/demo/*.svg` and its `config.json` (approved anonymous Pip sample); `assets/backgrounds/atlas_expansion/first_place/composite.png` (user-created Cyberpath art, The First Place). Original attribution remains in the canonical project's asset manifest and location documentation. Demo names and color variations are anonymous samples, not class records.

Backend: the classroom service provides sanitized, read-only display archives through /board-api/public. These include only pet artwork, animation timing, limited mood/personality and food likes. Original backups and account management remain authenticated.

Scalable canvas targets native resolution up to a 3840 × 2160 pixel budget. Teacher setup offers 12/30/60/90 sample pets and name visibility. Static scenery is cached; backup PNGs are resized to a 320-pixel maximum edge to bound class memory. Food catalog and images are copied from canonical `config/foods.json` and `assets/foods/*.png`, retaining upstream attribution. Exact output depends on the connected computer and browser.

Playback timing fix: uses exported animation_frame_times first, then animation_speeds per action, then legacy frame_time. Inclusive loop ranges and non-looping final frames are preserved. Eating visits allow two full authored sequences. Board travel remains an ambient personality-based path; this fix restores authored sprite playback, not minigame Speed bonuses.

Public board: https://ragingaxolotl-art.github.io/cyber-pet-play/board/ . GitHub hosts only code and anonymous assets. Display artwork loads from the classroom service. Internet is needed to reload pets. Sample/local ZIP modes suspend auto-refresh until the next visit or Refresh class now.

Food shrinks through eight bites during a meal. Nearby pets on the same level briefly face each other and exchange personality-weighted feeling emotes, then resume wandering with a cooldown. No interaction interrupts stairs, eating, or washing. Resting pets can react without requiring movement art. Saved low happiness/energy/fullness/health influence idle feelings; display interactions do not change stats. Emote PNGs are copied from canonical `assets/emotes`, retaining the original project attribution. Atlas extraction follows `scripts/game/emote_art.gd`.

Persistent companions: five default sample pets appear in random colors with random personalities and temporary food likes. They stay alongside every class pet after loading; class pets keep their saved preferences. Minute polling still includes all class uploads. Tag requires walking art; chasers swap roles on contact. Activity/sociability sustain play, curiosity shortens it, and pets then chat about likes before losing interest at a personality-dependent rate. No persistent stat or friendship changes.

Feeling emotes draw directly over the scene without the cream backing rectangle. Text conversations retain their readable speech bubbles. Class polling reuses the same five sample objects, preserving colors, likes, positions and interactions rather than adding duplicates.

Version 8 supersedes the pairing workflow: public board auto-loads every latest backed-up pet without a password or local credential. The service returns a sanitized display ZIP containing artwork, timing, food preferences and limited mood/personality, with opaque IDs. Original backups, account data and management routes remain authenticated. Fullscreen layout uses the actual :fullscreen state, includes a touch exit button, and resizes/restarts animation on back/forward page restoration. Fullscreen re-entry requires a browser user gesture; returning to a normal window shows controls.

Version 9: tag partners stand beside each other when play ends, with spacing based on rendered artwork width and screen-edge bounds. Walking, stairs and tag collect session-only dirt (0.32 per stage width traveled); resting does not. Mud flecks are clipped to the pet silhouette and gradually fade through the cloud wash. Saved cleanliness is unchanged.

Version 10: class food choices follow saved tastes/tags; high curiosity permits a near-favorite alternative. Pets collect one food item at the feeding house, carry it visibly, offer it in conversations based on generosity, and snack after 75 seconds when resting if eating art exists. Each recipient judges the gift by its own preferences: liked +4, neutral +1, disliked −3 to its directional friendship (0–100, initially 50). Rejection retains the giver's item; acceptance transfers it only into an empty slot. Both pets receive a 60-second offer cooldown. Lower pair affinity reduces interaction likelihood. Held items and friendships survive minute polling and updated artwork but reset on page reload; no student-save writes, money or purchases. Disposition is not loaded or used yet. Existing personality effects remain: activity drives walking/tag; sociability drives chat duration; curiosity drives stairs/questions and shorter tag; generosity drives offers; bravery influences emotes.

Version 11: emote-only interactions. Curious pets exchange favorite-food pictures and remember them for the session. Generous pets collect remembered favorites for specific friends, ask with a question emote before transferring an item, and remember rejected items. Comfort gives a temporary board mood lift and +2 directional friendship without editing saved happiness. Friendly pairs match the slower walking pace; helpful pairs use deterministic stair routes to reach and traverse the cloud wash. Partner replacement safely ends paired interactions. No dialogue bubbles, food-name labels or visible friendship numbers; pet names, scenery signs and teacher controls remain. Memory survives routine polling and refreshed artwork, resets on reload. Disposition remains unused.

Version 12: three open-front shelters occupy roughly 30% of each floor, with distinct scaled huddle positions. A four-minute weather cycle brings gentle rain (seconds 30–90), a visual pinwheel gust (110–116), and a short confetti celebration (150–168). Personality affects shelter versus puddle play, investigating pinwheels, butterfly/cloud watching, celebration length and quiet breaks. Mud increases distance-based dirt; puddle hopping creates capped splash particles. No new sound, dialogue or student-save writes. Walking art gates travel and hopping; pets without it remain stationary and react with emotes. New world activities yield to existing tag, sharing, stair travel and wash escorts. Pause also freezes weather.

Version 13: nine additional games (hide-and-seek, follow the leader, races, freeze dance, copy emotes, rolling ball, balloon play, treasure hunt, and favorite guessing), with at most one automatic rematch. Activity, curiosity and sociability weight invitations, choice and duration. Movement art gates physical games; stationary pets can copy and guess. Games stay on one floor, use visible props, end with spacing, and cancel safely if a participant is replaced. Shelters now start as lumber. Pets approach assigned work positions; each arrived helper contributes 1/18 progress per second to building or dismantling. Cartoon dust hides the transformation. Empty sites make no progress; occupied shelters cannot be dismantled, and rain redirects dismantling into rebuilding. Construction recruits up to six available walkers according to generosity. All game/build state is session-only.


### Profile-driven board (v14)

Only backed-up class pets appear; automatic samples and the sample-crowd control are removed. Explicit test-character/test-pet/demo-pet labels are excluded; the name Pip alone is valid. The public display projection v2 includes only speed skill level, Love and six personality axes in addition to the existing artwork/care/food whitelist. Older missing fields default to neutral Love 50 and speed level 25.

Travel rate is normalized stage distance: 0.018 × (0.55 + speed/99 × 1.9) × (0.7 + activity/100 × 0.6), with at most a 12.5% Love/activity expression adjustment. All solo travel uses this, including games, stairs, washing and building. Shared walks/escorts match the slower pet; tag uses each participant's own speed.

Love changes expression, never axis direction: solitary/social means peaceful independence/warm company versus withdrawal/persistent invitations; familiar/curious means dependable routines/shared learning versus rigid routines/restless investigation; cautious/brave means thoughtful observation/confident exploration versus prolonged alarm/reckless puddle investigation; keeping/generous means needs-aware help/thoughtful gifts versus guarded resources/approval-seeking offers; accommodating/assertive means cooperation/clear leadership versus overcommitting/insistent reactions; restful/active means restorative pauses/encouraging play versus inertia/restlessness. These are probabilities, not permanent moral labels. All six affect choices and have different emotes at both ends; no explanatory text appears over pets.

Each pet gets 48 stable, randomly placed body-wide dirt marks. Walking adds dirt by distance, mud adds more, puddles add 7% dirt per splash (10% when playing), and the cloud wash fades it away. The one-slot held item is visible only during eating or showing/offering it. All dirt, item and friendship state stays in the board session and survives profile polling; no save writes.


### Companion correction (v15)
Fern, Echo, Moss and Nova are permanent colorful board residents and join every auto-loaded class. Pip and uploaded test-character copies remain excluded. Resident objects, colors and randomized preferences stay stable through class polling; the latest speed/Love, dirt and hidden-inventory behavior applies to them too.


### Saved appearance (v16)
The public projection now retains only validated display.pet_scale (0.01–16) and display.pet_y_offset (−2048–2048). Projection cache v3 rebuilds existing backups. Board uses original artwork pixel dimensions even when browser decoding downsizes images, with the Godot 1.25 pixel conversion and common board/crowd factor (220 game-pixel reference). Scale is no longer normalized away per pet. Positive Y moves down, negative Y moves up relative to the platform; shadows stay on the platform. Defaults match Godot: scale 3, offset 0. Changes come from the most recent uploaded backup, not unsaved editor drafts.


### Wash coverage fix (v17)
Cleaning and water effects follow physical presence in the top-floor wash, after all movement systems run. Tag, games, shared walks, construction travel and station cooldowns no longer bypass cleaning. Crossing distance plus time under water removes dirt; standing under water also cleans. Other floors, stairs and screen-wrap jumps do not count.


### Rain and self-care decisions (v18)
Pets seek the cloud wash from any level using stairs when session cleanliness falls below their personality threshold. Activity, curiosity and bravery weight enjoyment of mud; familiar/restful/cautious profiles tend to prefer cleanliness. Love moderates anxious fussiness versus postponing care, without making mud play inherently negative. Wash trips respect movement artwork, existing groups and jobs, with cooldowns; incidental water still cleans everyone.
Shelter construction begins only during rain. Pets wanting cover and friendly/helpful pets join; a per-rain decision prevents repeated recruitment rolls from eventually forcing everyone to build. Pets wanting shelter can wait for a roof or join construction. Finished shelter-seekers huddle; helpers who enjoy rain can return outside. Once rain ends and occupants leave, workers dismantle full or unfinished huts. More helpers still work faster in cartoon smoke. All decisions remain session-only and emote-based.

Build starts are staggered per level (3–21 seconds after rain is noticed); teardown starts 8–36 seconds after rain stops. Helpers join individually at randomized 2–6 second intervals. Travel adds natural variation, and arrived helpers still accelerate actual work.


## Food-house attendant
Two user-provided 4×4 sprite atlases are mapped in `dist/counter.js`; frame choices and original attribution are in `dist/assets/attendant/README.md`. The attendant stays behind the raised counter, turns using intermediate poses, serves queued favorite-food orders, and returns to a restrained idle. Unconnected gestures are omitted. Pets wait for the handoff before their eating animation and shrinking meal begin. Missing NPC art permits immediate meals. No character/profile data is changed.


### Animated board residents and counter queue (v20)

PixelLab API-generated sequences now give both counter hosts breathing/blinking idles, talking, food passing and occasional selfies. Every clip uses a shared exact rest frame at its boundaries. Action selection waits for idle/action completion, with staggered replies and serving priority. The original 4 × 4 sheets remain as a loading fallback. Sources and generation IDs are recorded in dist/assets/npcs/README.md and clips.json.

Food visitors join a physical FIFO queue with artwork-width spacing. Each waits for an individual handoff, walks to a reserved dining space and then eats or stores the food if eating art is missing. Full queues are skipped until a later lap. Food preference and six personality axes moderated by Love select emote-only reactions; no saved stats or friendships change.

One winged unicorn flies between random positions, drops up to five temporary toy props, chooses clear landing places, exchanges personality-sensitive emotes with nearby pets, and takes off again. Pets react when they reach a dropped toy. Flight clips finish their loop before transitions; a newly occupied landing spot causes another takeoff. All NPC schedules, toys and queue state are session-only. No extra sample or test pets are added.

### Shared host gestures (v21)

The counter hosts now take coordinated breaks: they turn toward each other and converse, laugh together, hug, high-five, and take a shared selfie. The five actions are shuffled without repeating until each has played. A break is requested after 12–24 seconds, starts only with an empty food queue, and waits for both hosts to finish their current poses. An arriving customer cancels a pending break; an already-started 4.5–6.5-second gesture finishes its return before service resumes.

Shared 128 × 64 PixelLab sequences keep both characters’ hands, gaze, approach and recovery synchronized. Each begins and ends on an exact side-by-side composition of their original resting cells. Individual and paired drawing use the same pixel positions at every aspect ratio. The originals and previous solo animation clips remain available; missing shared artwork leaves normal service and idle animation running. No dialogue text or student-save changes.

### Walking hosts and gallery poses (v22)

The two hosts alternate short, casual walks along the jungle level, stopping outside the counter to perform a gallery pose before returning home. One host stays available for arriving food customers. Departures wait for the current animation to reach rest and for an empty queue; paired interactions wait until both people are back. Walks, poses and return trips remain session-only.

Each person cycles through three additional original gallery poses. The turquoise-skirt host looks around, flips her hair and smiles with hands near her face; the white-shirt host looks around, waves and uses her phone. New PixelLab entrance frames lead to the exact original gallery cell, hold it briefly, then play the transition back to the exact original rest. Walking is a small sideways step cycle; return trips reverse that cycle. No disconnected pose is inserted mid-motion.

Board v23 adds counter/walking lean poses, a quick white-shirt blink distinct from sleepy rests, and faster movement frames with separate pose holds. The unicorn's ball is independently rendered, bounces, remains until collected, and can be carried/ shared in the existing session-only item slot. Toys are never eaten. Animation timing is configured in assets/npcs/clips.json.

Board v24 uses the same simulation update loop in the live page and full coexistence tests. Pets make staggered food trips using the stairs and eat at nearer reserved dining positions. A persistent session game rotation includes tag and all nine group games; automatic class refresh preserves that rotation. Optional scenery no longer consumes every free interval. Low saved energy reduces invitation frequency and game length instead of disabling play indefinitely; missing movement/eating artwork is still respected.

The unicorn drops two balls followed by one available food choice. Nearby pets approach drops: balls get visible solo or partner play before storage, carried balls can be brought out again later, and food uses the existing shrinking-bite eating animation. An already-held item is preserved during a dropped-food snack. Drops and inventory remain session-only. Girls use right-facing profile walk cycles, mirrored for leftward travel, with front/profile turning and recovery before gallery poses.


Board v25 makes the unicorn an occasional 48–60 second visitor, followed by 4–7 quiet minutes. The end of rain has a 75% chance to bring a visit forward, with a minimum 150 seconds since the previous departure. Entry and exit flights stay connected. Three-second rainbow trails and six-second falling glitter fade naturally; nearby pets and hosts show happy emotes without modifying saved stats. A visit has a 35% chance to approach an empty finished pavilion and take it down in three seconds of cartoon smoke. Rain, occupants and active builders prevent that trick.

Walking direction now takes priority over looking at a ball while pets move into play positions. Both hosts use measured movement direction for mirrored profile walks. Their shoe baselines ease onto the jungle platform outside the counter, using measured per-frame sprite bounds; poses and paired home gestures remain connected. The independently drawn toy releases at the fully extended front hoof (frame 4, 0.48 seconds), with a visible upward/forward arc, then bounces and remains playable.


### Full behavior and animation audit (v26)

The audit found and repaired seven classes of conflict:

- Automatic public projections and browser ZIP loading admitted only five legacy actions. Both now share an explicit 62-key board allowlist: 52 current slots and ten legacy fallback names. The projection cache is revision 4; an unchanged backup is reloaded when its projection revision changes. Privacy whitelists, opaque artwork names, account protection and size limits remain intact.
- The renderer never selected sad, sleeping, jumping or new social/mood/dance art. A shared animation selector now matches the actual activity, stair direction and personality/Love reaction. Authored frame times and loop ranges remain authoritative. Reaction clocks restart at entry, rather than showing the last frame of an already-old activity clock.
- Ambient glitter could replace food and social outcomes. It is now a separate presentation layer: food handoffs, disagreements, comfort and conversations retain priority. Dropped-food reactions are visible during eating.
- Fixed invitation ordering could favor one activity. Optional meals, games, social encounters, world events and hygiene rotate first choice every 12 seconds; active activities retain ownership, and a finished outcome gets two seconds of recovery.
- Replacing an uploaded backup rebuilt the pet at a new starting position. Stable display IDs now retain the pet object, location, groups, carried item and session relationships while applying new artwork, scale, offset, speed and personality. Missing movement art safely releases movement jobs.
- A busy counter could indefinitely exclude host walks and paired clips. Overdue walks can use the off-duty host; overdue shared gestures wait for the current handoff and then get a bounded break. Food receive poses have a brief handoff hold scoped to counter departure.
- Stale game/social cleanup could overwrite unrelated work; ownership checks prevent it. Race duration accounts for profile speed, with a 2.5-second result/recovery before rematches so victory artwork can appear. Stationary pets may finish eating without walking artwork.

Validation: the full production update loop was run for two 30-minute, 24-pet simulations with 58 automatic upload refreshes. All 52 modern board animation slots, all 31 host/pair/unicorn clips, all 15 emote groups, all nine group games plus tag, all five social interactions, and meals, toys, dirt/wash, shelter/weather activities were observed without forcing activity starts. A separate test exercises all ten legacy animation fallbacks. A continuously busy-counter test also reaches both hosts' walks and all five shared gestures. Synthetic ZIPs verify modern-only idle artwork and the public projection-to-browser loading path; no real student media or saves are test fixtures.

Intentional non-runtime artwork: original gallery source sheets and the superseded host1-walk.png, host2-walk.png and flyer-drop.png remain retained for provenance/recovery. Original attendant sheets are fallback artwork if the generated hosts fail to load. Combat-only attack/injury/power slots remain reserved for the game's battle system; this display does not invent combat to consume those sprites. Foods are a preference-driven catalog, so every food is not expected to appear in a single class session. New directional slots take precedence over their equivalent legacy aliases. No unexplained board animation omissions remain in the audited catalog; future new slots need an explicit mapping and projection allowlist entry.


### v37 — personality, illness and board care

The board now imports sanitized active fictional conditions from local ZIPs and public projection revision 6. Original pet IDs determine cosmetic variants before public anonymization, so Glitch Fever / Crystal Bloom and Sporefan / Static Mites match the game. Only family, whitelisted effect ID and severity are exposed; no location history, original ID, medicine stock or account data is added to the public projection.

Personality affects care timing and spacing. Higher assertiveness requests medicine sooner; caution and routine also shorten the delay (2–18 board seconds). Higher generosity favors earlier quarantine; sociability and Love modify the delay (1–12 seconds). Cautious and solitary pets prefer more distance and react sooner. Every personality receives care. No trait, friendship, saved health, gold or inventory is changed.

Glitch Fever, Sporefan and Static Mites are contagious. Crystal Bloom, Mosswire, Bitrot, food/stomach conditions, stress/corruption, fatigue and injuries are not. Transmission requires the same floor, no stairs, and horizontal separation below 8.5% of stage width. Each susceptible pet draws an 8–24 second accumulated close-contact threshold for that variant; separation removes exposure twice as quickly. Multiple sources do not multiply the rate. A frozen source list prevents infections chaining within one frame. New infections start Mild. Quarantine and receiving medicine prevent both incoming and outgoing transmission; recovery grants immunity to that variant for the remaining session.

Quarantine is an in-place care boundary with a dashed teal ring, avoiding teleportation or requiring walking frames. Healthy walking pets can give contagious peers space without losing friendship; missing movement art keeps a pet stationary. Existing meals, games, conversations and stairs finish before illness takes control. Care is delivered to the character with a vial/receive pose, with a dose every six board seconds. The lowest-price complete single-product course is selected from copied configured effects, excluding drawback medicines; dose effects use its treatment power. `care-medicines.js` mirrors the October 23 game configuration and must be regenerated when supply balance changes. No saved supplies are spent. Board time is compressed and is not the saved game's condition timer.

Icons reuse eleven existing PixelLab images from `assets/care/pixellab-2026-10-23/`; attribution and generation provenance remain in that directory and `docs/condition-art-and-medicines.md`. No new generations. Chroma Drain desaturates the character; Signal Flicker smoothly changes opacity over 2.4 seconds, never below 60%, with steady opacity for reduced motion. Existing food/social reactions keep emote priority. Uploaded cause labels are shown; this board does not invent corrupted travel or food-overuse events in its fixed landscape.

Repeated roster refreshes keep local infections and recoveries. Changed uploaded family/ID/severity replaces that family's session snapshot; unchanged snapshots do not reapply cured conditions. Reloading the whole page begins a new display session. The board source and classroom projection both need deployment for public backups to show conditions. Local ZIPs work directly. See `docs/condition-art-and-medicines.md` for the complete cause and medicine guide.


### Unicorn outbreak care — 80% tent / 20% delivery

After a contagious condition appears, the board rolls once for a unicorn care visit: 30% with one infected character, plus 5 percentage points for each additional infected character. A failed roll retries once per active board minute. Each infected-character minute adds 5 percentage points, capped at 100%. Changing infection counts accumulate only their actual time; paused time does not count. A successful roll waits for a safe flight transition without rolling again. If the outbreak clears before arrival, the pending visit is canceled after the 30-second outbreak reset. Noncontagious stomach issues, stress and injuries do not increase the arrival odds. The user's final preference is **80% pop-up tent, 20% individual delivery**. If all three tent sites are occupied, the visit falls back to delivery. Normal toy throws, greetings and pavilion magic do not interrupt a care visit.

The tent uses a clear spot on the courtyard floor. Sick walking characters on that floor approach one at a time. Characters on other floors, without walking artwork, or unable to reach the tent within 25 seconds receive a personal delivery. The unicorn flies to each delivery recipient and visibly hands over a potion over 2.4 seconds. This is not a mass cure. Existing owned activities finish before a character is selected; their usual medicine timer pauses only while they are reserved for this handoff. Pending characters can still recover through ordinary care.

One magical outbreak potion clears the recipient's current board conditions and grants immunity to contagious variants already observed in that outbreak. A purple shield marks the protection. A different disease can still spread later; the same variant cannot keep cycling through treated characters in this board session. Changed uploaded condition snapshots can replace this display state. No save, gold or inventory is changed.

At most one care visit is scheduled per outbreak; 30 seconds without an active contagious condition separates outbreaks. The visit continues through the eligible sick roster, including new sick arrivals, and ends when nobody remains to treat. A timeout scaled to roster size releases reservations if activities never become available. Removed characters and missing movement art are handled without stranded reservations. Tent artwork is drawn in code; unicorn and condition art are reused, with no new PixelLab generations.


Published board release 38 preserves teacher reward controls from the current public board.
