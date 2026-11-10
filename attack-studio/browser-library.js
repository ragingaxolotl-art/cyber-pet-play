import {requestEditorName} from './editor-name-dialog.js?v=20261110-layout-safety';
import {BrowserLibrarySession,BROWSER_LIBRARY_KEY} from './browser-library-session.js?v=20261110-library-concurrency';
import {downloadJson} from './workspace-transfer.js?v=20261110-panel-hitbox-resize-r2';
import {emptyBrowserLibrary, normalizeBrowserLibrary, editBrowserLibrary, savedSearchFilters, searchFilters} from './browser-library-model.js?v=20261110-library-concurrency';
export {searchFilters} from './browser-library-model.js?v=20261110-library-concurrency';
export {BROWSER_LIBRARY_KEY} from './browser-library-session.js?v=20261110-library-concurrency';
export function browserStorage() { try { return localStorage; } catch { return null; } }
function loadLibrary(storage) {
 try { return {library: normalizeBrowserLibrary(JSON.parse(storage.getItem(BROWSER_LIBRARY_KEY) || '{}')), readable: true}; }
 catch { return {library: emptyBrowserLibrary(), readable: false}; }
}
export function readBrowserLibrary(storage) { return loadLibrary(storage).library; }
export function installBrowserLibrary({host, showFilter, getFilters, setFilters, getSelected, refresh, status, storage = browserStorage()}) {
 const make = (tag, text) => { const node = document.createElement(tag); if (text) node.textContent = text; return node; };
 const session = new BrowserLibrarySession(storage);
 let library = session.library;
 const history = session.history;
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
  storageNotice.textContent = session.readable || !storage
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
 function renderSession() {library=session.library;showStorageNotice(session.saved);fill();refresh();}
 async function change(operation,label,expected) {
  try {await session.change(operation,label,expected);} finally {renderSession();}
 }
 async function restoreHistory(direction) {
  try {await session.restoreHistory(direction);} finally {renderSession();}
  status(direction==='undo'?'Undid library edit. Attack definitions are unchanged.':'Redid library edit. Attack definitions are unchanged.');
 }
 action(historyRow,'Download library recovery',()=>{
  downloadJson({format:'cyber-pet-browser-library',library},'cyber-pet-library-recovery.json');
  status('Downloaded collections, saved searches and removed items. Attack definitions must be backed up separately.');
 });
 const recoveryInput=make('input');recoveryInput.type='file';recoveryInput.accept='.json,application/json';recoveryInput.hidden=true;group.append(recoveryInput);
 action(historyRow,'Import library recovery',()=>recoveryInput.click());
 recoveryInput.onchange=async event=>{
  const file=event.target.files[0];recoveryInput.value='';if(!file)return;
  let message;
  try{
   if(file.size>8*1024*1024)throw Error('Choose a library recovery file under 8 MiB.');
   const value=JSON.parse(await file.text());
   if(value.format!=='cyber-pet-browser-library')throw Error('Choose a library recovery file. Attack projects open from the File menu.');
   await session.importRecovery(value.library);message='Imported recovery as separate copies. Existing collections and searches are unchanged. Undo library edit removes the added copies.';
  }catch(error){message=error.message;}finally{renderSession();}
  status(message);
 };
 action(historyRow,'Load saved library',async()=>{
  if(session.pending&&!confirm('Replace this window’s unsaved library edits with the saved library? Download library recovery first to keep both versions.'))return;
  try {await session.reload();} finally {renderSession();}
  status('Loaded the saved library. Library Undo/Redo has been cleared. Attack definitions are unchanged.');
 });
 function selected(kind) {
  const entry = library[kind].find(item => item.id === (kind === 'collections' ? collections.value : searches.value));
  if (!entry) throw Error(`Choose a ${kind === 'collections' ? 'collection' : 'saved search'} first.`); return entry;
 }
 action(collectionRow, 'New collection', async () => {
  const name = await requestEditorName('Name this attack collection'); if (!name) return;
  const entry = {id: crypto.randomUUID(), name, items: []}; await change({type: 'create', kind: 'collections', entry}, 'Create collection'); collections.value = entry.id;
  status('Created ' + name + '. Select an attack preview, then Add selected to collection.');
 });
 for (const [kind, parent, noun] of [['collections', collectionRow, 'collection'], ['searches', searchRow, 'saved search']]) {
  action(parent, 'Rename ' + noun, async () => { const entry = selected(kind), name = await requestEditorName('Rename ' + noun, entry.name); if (!name) return; await change({type: 'rename', kind, id: entry.id, name}, 'Rename ' + noun, entry); status('Renamed ' + noun + ' to ' + name + '.'); });
  action(parent, 'Remove ' + noun, async () => { const entry = selected(kind); await change({type: 'remove', kind, id: entry.id}, 'Remove ' + noun); status('Removed ' + entry.name + '. Restore it under Removed collections & searches or use Undo library edit.'); });
 }
 const membershipRow = make('div'); membershipRow.className = 'browser-library-actions'; collectionRow.append(membershipRow);
 for (const [text, add] of [['Add selected to collection', true], ['Remove selected from collection', false]]) {
  action(membershipRow, text, async () => { const collection = selected('collections'), entry = getSelected(); if (!entry) throw Error('Select an attack preview first.'); await change({type: 'membership', kind: 'collections', id: collection.id, attackId: entry.id, add}, add ? 'Add collection member' : 'Remove collection member'); status(add ? 'Added ' + entry.name + ' to ' + collection.name + '.' : 'Removed collection membership. The attack is unchanged.'); });
 }
 action(membershipRow, 'Show collection', () => { const entry = selected('collections'); setFilters(searchFilters({collection: 'collection:' + entry.id})); refresh(); });
 action(searchRow, 'Save this search', async () => {
  const name = await requestEditorName('Name this search'); if (!name) return;
  const entry = {id: crypto.randomUUID(), name, filters: searchFilters(getFilters())}; await change({type: 'create', kind: 'searches', entry}, 'Save search'); searches.value = entry.id; status('Saved search ' + name + '.');
 });
 action(searchRow, 'Update saved search', async () => { const entry = selected('searches'); await change({type: 'filters', kind: 'searches', id: entry.id, filters: getFilters()}, 'Update search filters'); status('Updated filters for ' + entry.name + '. Undo library edit restores its previous filters.'); });
 action(searchRow, 'Open saved search', () => { const entry = selected('searches'); setFilters(savedSearchFilters(library, entry)); refresh(); });
 action(removedSection, 'Restore library item', async () => {
  if (removed.value === '') throw Error('Choose a removed item first.');
  const item = library.removed[Number(removed.value)]; if (!item) throw Error('Choose a removed item first.');
  await change({type: 'restore', kind: item.kind, id: item.entry.id}, 'Restore library item');
  (item.kind === 'collections' ? collections : searches).value = item.entry.id; status('Restored ' + item.entry.name + '.');
 });
 fill(); showStorageNotice(session.saved); return {collections: () => library.collections};
}
