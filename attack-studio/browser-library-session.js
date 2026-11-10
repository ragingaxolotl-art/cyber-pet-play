import {EditHistory} from './edit-history.js';
import {emptyBrowserLibrary, normalizeBrowserLibrary, editBrowserLibrary, importBrowserLibrary} from './browser-library-model.js?v=20261110-library-concurrency';
export const BROWSER_LIBRARY_KEY = 'cyber-pet-browser-library-v1';
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const item = (library, operation) => operation.type === 'restore'
 ? library.removed.find(value => value.kind === operation.kind && value.entry.id === operation.id)
 : library[operation.kind]?.find(value => value.id === operation.id);

export class BrowserLibrarySession {
 constructor(storage, locks = globalThis.navigator?.locks) {
  this.storage = storage; this.locks = locks;
  this.raw = null; this.readable = false; this.saved = false;
  this.library = emptyBrowserLibrary();
  try {
   this.raw = storage.getItem(BROWSER_LIBRARY_KEY);
   this.library = normalizeBrowserLibrary(JSON.parse(this.raw || '{}'));
   this.readable = true; this.saved = true;
  } catch {}
  this.base = structuredClone(this.library);
  this.history = new EditHistory(this.library);
 }
 get pending() { return !same(this.library, this.base); }
 async exclusive(action) {
  return this.locks?.request ? this.locks.request(BROWSER_LIBRARY_KEY, action) : action();
 }
 synchronize() {
  if (!this.readable || !this.storage) return false;
  let raw;
  try { raw = this.storage.getItem(BROWSER_LIBRARY_KEY); } catch { throw Error('Could not check the saved library. Your current library is unchanged; try again or download library recovery.'); }
  if (raw === this.raw) return false;
  if (this.pending) throw Error('The saved library changed in another window. Your unsaved session edits are still here. Download library recovery before loading the saved library.');
  let latest;
  try { latest = normalizeBrowserLibrary(JSON.parse(raw || '{}')); }
  catch { throw Error('The saved library changed but could not be read. This window and the saved data are unchanged. Download library recovery to keep this version.'); }
  this.raw = raw; this.library = latest; this.base = structuredClone(latest);
  this.saved = true; this.history.reset(latest);
  return true;
 }
 persist(next) {
  this.saved = false;
  try {
   if (this.storage && this.readable) {
    const raw = JSON.stringify(next); this.storage.setItem(BROWSER_LIBRARY_KEY, raw);
    this.raw = raw; this.base = structuredClone(next); this.saved = true;
   }
  } catch {}
  this.library = next;
 }
 async change(operation, label, expected = item(this.library, operation)) {
  return this.exclusive(() => {
   this.synchronize();
   if (operation.type !== 'create' && !same(expected, item(this.library, operation))) {
    throw Error('This library item changed in another window. The latest version is shown; review it and try again. Previous library Undo/Redo was cleared to protect those changes.');
   }
   const next = editBrowserLibrary(this.library, operation);
   this.history.record(next, '', Date.now(), label); this.persist(next);
  });
 }
 async restoreHistory(direction) {
  return this.exclusive(() => {
   if (this.synchronize()) throw Error('The library changed in another window. The latest version is shown; previous library Undo/Redo was cleared to protect those changes.');
   const next = this.history[direction](); if (next) this.persist(next);
  });
 }
 async importRecovery(value) {
  return this.exclusive(() => {
   this.synchronize();
   const next=importBrowserLibrary(this.library,value);
   this.history.record(next,'',Date.now(),'Import library recovery');this.persist(next);
  });
 }
 async reload() {
  return this.exclusive(() => {
   const raw = this.storage.getItem(BROWSER_LIBRARY_KEY);
   const latest = normalizeBrowserLibrary(JSON.parse(raw || '{}'));
   this.raw = raw; this.library = latest; this.base = structuredClone(latest);
   this.saved = true; this.readable = true; this.history.reset(latest);
  });
 }
}
