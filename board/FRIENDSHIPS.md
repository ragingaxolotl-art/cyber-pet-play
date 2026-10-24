# Board friendships

Board release 39 uses directional scores from 0 to 100, starting at 50. A character may feel differently about a peer than that peer feels about it. All six personality axes affect social behavior: sociability influences approaching and enjoying conversations; curiosity and activity preferences affect compatibility; assertiveness and mood affect disagreement; generosity, bravery and Love influence repair. Existing willingness, gift, comfort and shared-play behavior stays active. Traits are tendencies, never a guarantee that a pet will argue.

| Score | Level |
| --- | --- |
| 0–19 | Strong disagreement |
| 20–39 | Strained |
| 40–54 | Getting acquainted |
| 55–69 | Friendly |
| 70–84 | Good friends |
| 85–100 | Best friends |

Friendly conversations award 1–2.5 points based on curiosity compatibility and sociability. A character with decoded `talk_side` artwork gets one extra point for a friendly conversation. Missing talking artwork never prevents friendship. Disagreements subtract 2–4 points according to assertiveness. Apologies restore 3 points. One conversation outcome happens after 2.5 uninterrupted seconds; the same pair cannot earn repeated conversation outcomes within 60 active seconds. Completed favorite-learning exchanges add 1 each, comfort adds 2 to the recipient, and accepted/disliked gifts retain their existing +4/+1/−3 effects. Friendly post-tag dialogue is preserved.

Speech is short preset fictional dialogue above the active speaker, alternating with the listening turn. There is no microphone, generated student dialogue, or student chat collection. Scores and peer names are available through **Friendships** in the header; each row includes a meter and named level.

## Saving and character files

On one classroom board, open **Friendships**, enter the teacher password, and select **Enable 15-minute saves**. This saves an initial snapshot, then saves every 900 seconds of active, visible, unpaused simulation. **Save now** writes early. Hidden-tab time and paused time do not count. Closing/reloading the board stops the writer; enable it again for the next session. The password stays only in the current page's memory and the input is cleared immediately; it is never placed in browser storage or URLs.

Each stable character record remembers up to three closest peers with scores above 50 and up to three least-liked peers below 50. The strongest positive relationship is also recorded as `bestFriend`; its actual level remains visible, so a closest acquaintance is not mislabeled Best friends. Ties use stable IDs. Neutral peers are not artificially ranked as disliked. Other session scores are not retained after reload. Fern, Echo, Moss and Nova can also be remembered. Local ZIP previews have no authority to save into class records.

The authoritative JSON file lives in the classroom service's existing R2 bucket at `board-friendships/classroom-v1.json`, with a distinct record per stable character identity. **Download friendship file** exports the selected character's current rankings as JSON, including last saved time and export time. These board friendship files are stored alongside the gameplay backup system; this feature does not insert fields into, rewrite, or upload the student's original game ZIP. Offline game progress does not yet consume these records.

`GET /board-api/friendships` returns public fictional character relationships, consistent with the public board. `POST` requires the teacher password and a matching record revision. The service validates character identities against backed-up pets, resolves names itself, rejects duplicates/self-links/invalid scores and bounds both lists to three. Saved records use stable display IDs, so later artwork uploads preserve relationships without exposing account IDs. R2 conditional writes atomically reject a competing board save. A conflict stops automatic writing and asks the teacher to reload saved friendships; transient failures retry after one active minute. No student backup revision, gold, inventory, health, or personality value is overwritten.

The automatic timer and save/reload paths are tested with anonymous data. Original ZIP projection/privacy, teacher reward issuance, health, quarantine, contagion, unicorn care and board activities retain their checks.
