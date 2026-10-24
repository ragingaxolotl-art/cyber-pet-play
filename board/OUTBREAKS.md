# Automatic board outbreaks

Release 40 checks once per active minute. The first check has a 1-in-30 chance; after each failed minute the chance increases to 1 divided by the remaining minutes. Minute 15 is 1-in-16, minute 29 is 1-in-2, and minute 30 is guaranteed if a healthy, unprotected character is available. This distributes onset uniformly across minutes 1–30 (average 15.5 minutes). The timer restarts after an outbreak begins, including an imported contagious outbreak.

One character receives a mild case of Glitch Fever, Sporefan or Static Mites. Different diseases are preferred between outbreaks when eligible. The normal personality, contagion, quarantine, medicine and unicorn systems then handle it. A fresh outbreak is not stacked onto an active contagious outbreak. Existing immunity and potion shields are never removed to force an infection. If nobody is eligible at the deadline, the attempt stays pending until someone becomes eligible. Empty boards, paused time and hidden-tab time do not advance the clock; refreshing the board starts a new session timer. Uploaded gameplay saves are unchanged.

Settings and probability are in `outbreaks.js`. Existing medicine and unicorn arrival settings are unchanged.
