import {requestEditorName} from './editor-name-dialog.js';
import {EditHistory} from './edit-history.js?v=20261110-library-management';
import {emptyBrowserLibrary, normalizeBrowserLibrary, editBrowserLibrary, savedSearchFilters, searchFilters} from './browser-library-model.js?v=20261110-library-management';
export {searchFilters} from './browser-library-model.js?v=20261110-library-management';
export const BROWSER_LIBRARY_KEY = 'cyber-pet-browser-library-v1';
export function browserStorage() { try { return localStorage; } catch { return null; } }
function loadLibrary(storage) {
 try { return {library: normalizeBrowserLibrary(JSON.parse(storage.getItem(BROWSER_LIBRARY_KEY) || '{}')), readable: true}; }
 catch { return {library: emptyBrowserLibrary(), readable: false}; }
}
export function readBrowserLibrary(storage) { return loadLibrary(storage).library; }
export function installBrowserLibrary({host, showFilter, getFilters, setFilters, getSelected, refresh, status, storage = browserStorage()}) {
 const make = (tag, text) => { const node = document.createElement(tag); if (text) node.textContent = text; return node; };
 const loaded = loadLibrary(storage);
 let library = loaded.library;
 const history = new EditHistory(library);
 const group = make('details'), summary = make('summary', 'Collections & saved searches');
 group.className = 'attack-browser-library'; group.append(summary); host.append(group);
 const row = title => { const node = make('div'); node.className = 'browser-library-row'; node.setAttribute('role', 'group'); node.setAttribute('aria-label', title); group.append(node); return node; };
 const collectionRow = row('Manage collections'), searchRow = row('Manage saved searches');
 function select(parent, labelText, accessibleName) {
  const label = make('label', labelText), field = make('select'); field.setAttribute('aria-label', accessibleName); label.append(field); parent.append(label); return field;
 }
 const collections = select(collectionRow, 'Collection', 'Collection to organize');
 const searches = select(searchRow, 'Saved search', 'Saved search');
 const action = (parent, text, fn) => {
  const button = make('button', text); button.type = 'button';
  button.onclick = async () => { try { await fn(); } catch (error) { status(error.message); } };
  parent.append(button); return button;
 };
 const removedSection = make('details'), removedSummary = make('summary', 'Removed collections & searches');
 removedSection.append(removedSummary); group.append(removedSection);
 const removed = select(removedSection, 'Recover an item', 'Removed library item');
 const historyRow = row('Library edit history');
 const undo = action(historyRow, 'Undo library edit', () => restoreHistory('undo'));
 const redo = action(historyRow, 'Redo library edit', () => restoreHistory('redo'));
 const help = make('p', 'Collections organize links to attacks. Save working drafts separately to keep them after reload. Removal is recoverable below and never deletes attacks.'); group.append(help);
 const storageNotice = make('p'); storageNotice.setAttribute('role', 'status'); group.append(storageNotice);
 function showStorageNotice(saved) {
  storageNotice.hidden = saved;
  storageNotice.textContent = loaded.readable || !storage
   ? 'Collections and saved searches work for this session but are not saved on this device. Keep this page open to retain them.'
   : 'The saved library could not be read. Changes work for this session but are not saved; the original stored data is preserved. Keep this page open to retain changes.';
 }
 function fill() {
  const selected = collections.value, search = searches.value, filter = showFilter.value, removedValue = removed.value;
  collections.replaceChildren(new Option('Choose collection', ''), ...library.collections.map(c => new Option(c.name, c.id)));
  searches.replaceChildren(new Option('Choose saved search', ''), ...library.searches.map(s => new Option(s.name, s.id)));
  collections.value = library.collections.some(c => c.id === selected) ? selected : '';
  searches.value = library.searches.some(s => s.id === search) ? search : '';
  showFilter.replaceChildren(new Option('All matches', ''), new Option('Favorites', 'favorites'), new Option('Recently used', 'recent'), ...library.collections.map(c => new Option(c.name, 'collection:' + c.id)));
  showFilter.value = filter === 'favorites' || filter === 'recent' || library.collections.some(c => 'collection:' + c.id === filter) ? filter : '';
  removed.replaceChildren(new Option('Choose removed item', ''), ...library.removed.map((item, index) => new Option(`${item.kind === 'collections' ? 'Collection' : 'Search'} · ${item.entry.name}`, String(index))));
  removed.value = removedValue && Number(removedValue) < library.removed.length ? removedValue : '';
  removedSummary.textContent = `Removed collections & searches (${library.removed.length})`;
  undo.disabled = !history.past.length; redo.disabled = !history.future.length;
  undo.title = history.past.length ? 'Undo ' + history.currentLabel : 'No library edits to undo';
 }
 function save(next) {
  let saved = false;
  // Never replace unreadable saved data with an empty recovered library.
  try { if (storage && loaded.readable) { storage.setItem(BROWSER_LIBRARY_KEY, JSON.stringify(next)); saved = true; } } catch {}
  showStorageNotice(saved); library = next; fill(); refresh();
 }
 function change(operation, label) {
  const next = editBrowserLibrary(library, operation); history.record(next, '', Date.now(), label); save(next);
 }
 function restoreHistory(direction) {
  const next = history[direction](); if (!next) return;
  save(next); status(direction === 'undo' ? 'Undid library edit. Attack definitions are unchanged.' : 'Redid library edit. Attack definitions are unchanged.');
 }
 function selected(kind) {
  const entry = library[kind].find(item => item.id === (kind === 'collections' ? collections.value : searches.value));
  if (!entry) throw Error(`Choose a ${kind === 'collections' ? 'collection' : 'saved search'} first.`); return entry;
 }
 action(collectionRow, 'New collection', async () => {
  const name = await requestEditorName('Name this attack collection'); if (!name) return;
  const entry = {id: crypto.randomUUID(), name, items: []}; change({type: 'create', kind: 'collections', entry}, 'Create collection'); collections.value = entry.id;
  status('Created ' + name + '. Select an attack preview, then Add selected to collection.');
 });
 for (const [kind, parent, noun] of [['collections', collectionRow, 'collection'], ['searches', searchRow, 'saved search']]) {
  action(parent, 'Rename ' + noun, async () => { const entry = selected(kind), name = await requestEditorName('Rename ' + noun, entry.name); if (!name) return; change({type: 'rename', kind, id: entry.id, name}, 'Rename ' + noun); status('Renamed ' + noun + ' to ' + name + '.'); });
  action(parent, 'Remove ' + noun, () => { const entry = selected(kind); change({type: 'remove', kind, id: entry.id}, 'Remove ' + noun); status('Removed ' + entry.name + '. Restore it under Removed collections & searches or use Undo library edit.'); });
 }
 const membershipRow = make('div'); membershipRow.className = 'browser-library-actions'; collectionRow.append(membershipRow);
 for (const [text, add] of [['Add selected to collection', true], ['Remove selected from collection', false]]) {
  action(membershipRow, text, () => { const collection = selected('collections'), entry = getSelected(); if (!entry) throw Error('Select an attack preview first.'); change({type: 'membership', kind: 'collections', id: collection.id, attackId: entry.id, add}, add ? 'Add collection member' : 'Remove collection member'); status(add ? 'Added ' + entry.name + ' to ' + collection.name + '.' : 'Removed collection membership. The attack is unchanged.'); });
 }
 action(membershipRow, 'Show collection', () => { const entry = selected('collections'); setFilters(searchFilters({collection: 'collection:' + entry.id})); refresh(); });
 action(searchRow, 'Save this search', async () => {
  const name = await requestEditorName('Name this search'); if (!name) return;
  const entry = {id: crypto.randomUUID(), name, filters: searchFilters(getFilters())}; change({type: 'create', kind: 'searches', entry}, 'Save search'); searches.value = entry.id; status('Saved search ' + name + '.');
 });
 action(searchRow, 'Update saved search', () => { const entry = selected('searches'); change({type: 'filters', kind: 'searches', id: entry.id, filters: getFilters()}, 'Update search filters'); status('Updated filters for ' + entry.name + '. Undo library edit restores its previous filters.'); });
 action(searchRow, 'Open saved search', () => { const entry = selected('searches'); setFilters(savedSearchFilters(library, entry)); refresh(); });
 action(removedSection, 'Restore library item', () => {
  if (removed.value === '') throw Error('Choose a removed item first.');
  const item = library.removed[Number(removed.value)]; if (!item) throw Error('Choose a removed item first.');
  change({type: 'restore', kind: item.kind, id: item.entry.id}, 'Restore library item');
  (item.kind === 'collections' ? collections : searches).value = item.entry.id; status('Restored ' + item.entry.name + '.');
 });
 fill(); showStorageNotice(loaded.readable); return {collections: () => library.collections};
}
