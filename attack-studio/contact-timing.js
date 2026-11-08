// Contact can occur through the deadline frame. Recovery begins on the next frame.
export const CONTACT_TIMEOUT=600;
export const contactDeadline=timing=>timing.startup+CONTACT_TIMEOUT;
export const activeEnd=(impact,timing)=>impact===null?contactDeadline(timing)+1:impact+timing.active;
export const castEnd=(impact,timing)=>activeEnd(impact,timing)+timing.recovery;
