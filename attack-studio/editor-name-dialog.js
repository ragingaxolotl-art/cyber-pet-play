/** Accessible naming form shared by trees, data sets and workspace layouts. */
export function requestEditorName(title, initial = '') {
 return new Promise(resolve => {
  const previous = document.activeElement;
  const dialog = document.createElement('dialog');
  dialog.className = 'editor-name-dialog';
  dialog.setAttribute('aria-label', title);
  const form = document.createElement('form');
  const heading = document.createElement('h2'); heading.textContent = title;
  const label = document.createElement('label'); label.textContent = 'Name';
  const input = document.createElement('input');
  input.id = 'editorNameInput'; input.value = initial; input.required = true; input.maxLength = 80;
  label.setAttribute('for', input.id); label.append(input);
  const save = document.createElement('button'); save.type = 'submit'; save.textContent = 'Save name';
  const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = 'Cancel';
  const finish = value => { dialog.close(); dialog.remove(); const menu=previous?.closest('details');(menu&&!menu.open?menu.querySelector('summary'):previous)?.focus(); resolve(value); };
  form.onsubmit = event => { event.preventDefault(); const name = input.value.trim(); if(name && name.length <= 80) finish(name); };
  cancel.onclick = () => finish(null);
  dialog.addEventListener('cancel', event => { event.preventDefault(); finish(null); });
  form.append(heading, label, save, cancel); dialog.append(form); document.body.append(dialog);
  dialog.showModal(); input.focus();
 });
}
