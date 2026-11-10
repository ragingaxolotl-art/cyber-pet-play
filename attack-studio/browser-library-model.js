// Collections contain references only; removing one never removes an attack.
export const LIBRARY_LIMIT = 100;
const filterKeys = ['query', 'element', 'delivery', 'behavior', 'source', 'collection'];
export function searchFilters(value = {}) {
 return Object.fromEntries(filterKeys.map(key => [key, typeof value?.[key] === 'string' ? value[key].slice(0, 300) : '']));
}
export function emptyBrowserLibrary() { return {version: 2, collections: [], searches: [], removed: []}; }
function validName(name) {
 if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) throw Error('Use a name between 1 and 80 characters.');
 return name.trim();
}
function normalizeEntry(entry, kind) {
 if (!entry || typeof entry.id !== 'string' || !entry.id) throw Error('A saved library item has no ID.');
 const result = {id: entry.id, name: validName(entry.name)};
 if (kind === 'collections') {
  if (!Array.isArray(entry.items) || entry.items.some(id => typeof id !== 'string')) throw Error('A collection contains invalid attack references.');
  result.items = [...new Set(entry.items)];
 } else {
  if (!entry.filters || typeof entry.filters !== 'object' || Array.isArray(entry.filters)) throw Error('A saved search contains invalid filters.');
  result.filters = searchFilters(entry.filters);
 }
 return result;
}
export function normalizeBrowserLibrary(value) {
 if (!value || typeof value !== 'object' || Array.isArray(value) || (value.version !== undefined && ![1, 2].includes(value.version))) throw Error('Unsupported attack library format.');
 const result = emptyBrowserLibrary(), ids = new Set();
 const accept = (entry, kind) => {
  const normalized = normalizeEntry(entry, kind), key = kind + ':' + normalized.id;
  if (ids.has(key)) throw Error('Duplicate saved library ID.');
  ids.add(key); return normalized;
 };
 for (const kind of ['collections', 'searches']) {
  if (value[kind] !== undefined && !Array.isArray(value[kind])) throw Error('Invalid saved library list.');
  result[kind] = (value[kind] || []).map(entry => accept(entry, kind));
 }
 if (value.removed !== undefined && !Array.isArray(value.removed)) throw Error('Invalid removed library list.');
 result.removed = (value.removed || []).map(item => {
  if (!item || !['collections', 'searches'].includes(item.kind)) throw Error('Invalid removed library item.');
  return {kind: item.kind, entry: accept(item.entry, item.kind)};
 });
 return result;
}
export function editBrowserLibrary(library, operation) {
 const next = structuredClone(library), {kind, id} = operation;
 if (!['collections', 'searches'].includes(kind)) throw Error('Choose a collection or saved search.');
 const entry = next[kind].find(item => item.id === id);
 if (operation.type === 'create') {
  if (next[kind].length >= LIBRARY_LIMIT) throw Error(`You can save up to ${LIBRARY_LIMIT} ${kind}. Remove an unused item first.`);
  next[kind].push(normalizeEntry(operation.entry, kind));
 } else if (operation.type === 'restore') {
  const index = next.removed.findIndex(item => item.kind === kind && item.entry.id === id);
  if (index < 0) throw Error('Choose a removed item first.');
  if (next[kind].length >= LIBRARY_LIMIT) throw Error(`Remove an unused ${kind === 'collections' ? 'collection' : 'search'} before restoring this item.`);
  next[kind].push(next.removed.splice(index, 1)[0].entry);
 } else {
  if (!entry) throw Error(`Choose a ${kind === 'collections' ? 'collection' : 'saved search'} first.`);
  if (operation.type === 'rename') entry.name = validName(operation.name);
  else if (operation.type === 'remove') {
   next[kind] = next[kind].filter(item => item.id !== id);
   next.removed.push({kind, entry});
  } else if (operation.type === 'filters' && kind === 'searches') entry.filters = searchFilters(operation.filters);
  else if (operation.type === 'membership' && kind === 'collections') {
   if (typeof operation.attackId !== 'string' || !operation.attackId) throw Error('Select an attack preview first.');
   if (operation.add && !entry.items.includes(operation.attackId) && entry.items.length >= 3000) throw Error('This collection is full.');
   entry.items = operation.add ? [...new Set([...entry.items, operation.attackId])] : entry.items.filter(value => value !== operation.attackId);
  } else throw Error('Unknown library edit.');
 }
 return normalizeBrowserLibrary(next);
}
export function savedSearchFilters(library, search) {
 const reference = search.filters.collection;
 if (reference.startsWith('collection:') && !library.collections.some(item => 'collection:' + item.id === reference)) {
  const removed = library.removed.find(item => item.kind === 'collections' && 'collection:' + item.entry.id === reference);
  throw Error(removed ? `Restore the removed collection “${removed.entry.name}” before opening this search.` : 'This search refers to an unavailable collection. Update the search with new filters.');
 }
 return searchFilters(search.filters);
}

// Recovery adds copies. It never replaces another window's items, and references
// inside recovered searches follow their recovered collection copies.
export function importBrowserLibrary(library, value, newId = () => crypto.randomUUID()) {
 const recovered=normalizeBrowserLibrary(value),next=structuredClone(library),ids=new Map();
 for(const kind of ['collections','searches']) {
  if(next[kind].length+recovered[kind].length>LIBRARY_LIMIT)throw Error(`Recovery would exceed ${LIBRARY_LIMIT} ${kind}. Remove unused items first.`);
  for(const entry of [...recovered[kind],...recovered.removed.filter(item=>item.kind===kind).map(item=>item.entry)])ids.set(kind+':'+entry.id,newId());
 }
 function copy(entry,kind){
  const result=structuredClone(entry);result.id=ids.get(kind+':'+entry.id);
  result.name=(entry.name+' (recovered)').slice(0,80);
  if(kind==='searches'&&result.filters.collection.startsWith('collection:')){
   const id=ids.get('collections:'+result.filters.collection.slice(11));
   if(id)result.filters.collection='collection:'+id;
  }
  return result;
 }
 for(const kind of ['collections','searches'])next[kind].push(...recovered[kind].map(entry=>copy(entry,kind)));
 next.removed.push(...recovered.removed.map(item=>({kind:item.kind,entry:copy(item.entry,item.kind)})));
 return normalizeBrowserLibrary(next);
}
