'use babel';

/**
 * ConstructorPicker — a modal checkbox list of the class properties so the
 * user can pick which ones the generated constructor will assign.
 *
 * Author: Armin Daraei
 */

import { CompositeDisposable } from 'atom';

export default class ConstructorPicker {
  constructor({
    title,
    confirmLabel = 'Add Constructor',
    cancelLabel = 'Cancel',
    selectAllLabel = 'All',
    selectNoneLabel = 'None',
    properties = [],
    onConfirm = null,
    onCancel = null,
    rtl = false
  }) {
    this.title = title;
    this.confirmLabel = confirmLabel;
    this.cancelLabel = cancelLabel;
    this.selectAllLabel = selectAllLabel;
    this.selectNoneLabel = selectNoneLabel;
    this.properties = properties;
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
    this.rtl = rtl;
    this.disposables = new CompositeDisposable();
    this.disposed = false;
  }

  attach() {
    this.element = document.createElement('div');
    this.element.classList.add('csharpextensions-constructor-picker');
    this.element.setAttribute('tabindex', '-1');
    if (this.rtl) this.element.setAttribute('dir', 'rtl');

    const title = document.createElement('div');
    title.classList.add('csharpextensions-picker-title', 'icon', 'icon-gear');
    title.textContent = this.title;
    this.element.appendChild(title);

    const toolbar = document.createElement('div');
    toolbar.classList.add('csharpextensions-picker-toolbar');

    const allButton = document.createElement('button');
    allButton.classList.add('btn', 'btn-xs');
    allButton.textContent = this.selectAllLabel;
    allButton.addEventListener('click', () => this.setCheckedAll(true));

    const noneButton = document.createElement('button');
    noneButton.classList.add('btn', 'btn-xs');
    noneButton.textContent = this.selectNoneLabel;
    noneButton.addEventListener('click', () => this.setCheckedAll(false));

    toolbar.append(allButton, noneButton);
    this.element.appendChild(toolbar);

    const list = document.createElement('div');
    list.classList.add('csharpextensions-picker-list');

    this.checkboxes = this.properties.map((property) => {
      const row = document.createElement('label');
      row.classList.add('csharpextensions-picker-row');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;

      const typeSpan = document.createElement('span');
      typeSpan.classList.add('property-type');
      typeSpan.textContent = `${property.type} `;

      const nameSpan = document.createElement('span');
      nameSpan.textContent = property.name;

      row.append(checkbox, typeSpan, nameSpan);
      list.appendChild(row);
      return { checkbox, property };
    });

    this.element.appendChild(list);

    const actions = document.createElement('div');
    actions.classList.add('csharpextensions-picker-actions');

    const confirmButton = document.createElement('button');
    confirmButton.classList.add('btn', 'btn-primary', 'icon', 'icon-check');
    confirmButton.textContent = this.confirmLabel;
    confirmButton.addEventListener('click', () => this.confirm());

    const cancelButton = document.createElement('button');
    cancelButton.classList.add('btn', 'btn-flat');
    cancelButton.textContent = this.cancelLabel;
    cancelButton.addEventListener('click', () => this.cancel());

    actions.append(confirmButton, cancelButton);
    this.element.appendChild(actions);

    this.panel = atom.workspace.addModalPanel({
      item: this.element,
      visible: true,
      priority: 400
    });

    this.disposables.add(
      atom.commands.add(this.element, {
        'core:confirm': () => this.confirm(),
        'core:cancel': () => this.cancel(),
        'core:close': () => this.cancel()
      })
    );

    this.element.focus();
  }

  setCheckedAll(checked) {
    for (const entry of this.checkboxes) entry.checkbox.checked = checked;
  }

  confirm() {
    const selected = this.checkboxes
      .filter((entry) => entry.checkbox.checked)
      .map((entry) => entry.property);
    const callback = this.onConfirm;
    this.dispose();
    if (callback) callback(selected);
  }

  cancel() {
    const callback = this.onCancel;
    this.dispose();
    if (callback) callback();
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.disposables.dispose();
    if (this.panel) this.panel.destroy();
  }
}
