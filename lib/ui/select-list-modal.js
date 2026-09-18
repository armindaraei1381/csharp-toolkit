'use babel';

/**
 * SelectListModal — a filtered, keyboard-navigable selection list rendered
 * in a modal panel (Pulsar has no native QuickPick). Visual language follows
 * Pulsar's command palette: a mini editor on top, a scrollable list below.
 *
 * Keys: type to filter, ↑/↓ to move, Enter to confirm, Esc to cancel.
 * Mouse: move to highlight, click to confirm.
 *
 * Author: Armin Daraei
 */

import { CompositeDisposable } from 'atom';

export default class SelectListModal {
  /**
   * @param {object} options
   * @param {Array<{label, description?, value}>} options.items
   * @param {string}   [options.prompt]
   * @param {string}   [options.placeholderText]
   * @param {boolean}  [options.rtl]
   * @param {Function} [options.onConfirm]  receives (value, item)
   * @param {Function} [options.onCancel]
   */
  constructor({
    items = [],
    prompt = '',
    placeholderText = '',
    rtl = false,
    onConfirm = null,
    onCancel = null
  }) {
    this.items = items;
    this.prompt = prompt;
    this.placeholderText = placeholderText;
    this.rtl = rtl;
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
    this.disposables = new CompositeDisposable();
    this.disposed = false;
    this.visibleItems = [];
    this.selectedIndex = 0;
  }

  attach() {
    this.element = document.createElement('div');
    this.element.classList.add('csharp-toolkit-select-list-modal');
    if (this.rtl) this.element.setAttribute('dir', 'rtl');

    if (this.prompt) {
      const label = document.createElement('label');
      label.classList.add('csharp-toolkit-select-list-prompt', 'icon', 'icon-search');
      label.textContent = this.prompt;
      this.element.appendChild(label);
    }

    this.filterEditor = atom.workspace.buildTextEditor({
      mini: true,
      placeholderText: this.placeholderText,
      softWrapped: false
    });
    this.element.appendChild(this.filterEditor.getElement());

    this.listElement = document.createElement('ol');
    this.listElement.classList.add('list-group', 'csharp-toolkit-select-list');
    this.element.appendChild(this.listElement);

    this.panel = atom.workspace.addModalPanel({
      item: this.element,
      visible: true,
      priority: 400
    });

    const editorElement = this.filterEditor.getElement();
    this.disposables.add(
      atom.commands.add(editorElement, {
        'core:confirm': () => this.confirm(),
        'core:cancel': () => this.cancel(),
        'core:close': () => this.cancel(),
        'core:move-up': () => this.moveSelection(-1),
        'core:move-down': () => this.moveSelection(1)
      }),
      this.filterEditor.onDidChange(() => this.applyFilter())
    );

    this.applyFilter();
    editorElement.focus();
  }

  applyFilter() {
    const query = this.filterEditor.getText().trim().toLowerCase();
    const scored = [];
    for (const item of this.items) {
      const haystack = `${item.label} ${item.description || ''}`.toLowerCase();
      if (query && !haystack.includes(query)) continue;
      // Items whose label starts with the query float to the top.
      const score = query && item.label.toLowerCase().startsWith(query) ? 0 : 1;
      scored.push({ item, score });
    }
    scored.sort((a, b) => a.score - b.score || a.item.label.localeCompare(b.item.label));
    this.visibleItems = scored.map((entry) => entry.item);
    this.selectedIndex = 0;
    this.renderList();
  }

  renderList() {
    this.listElement.innerHTML = '';
    if (this.visibleItems.length === 0) {
      const empty = document.createElement('li');
      empty.classList.add('list-item', 'csharp-toolkit-select-list-empty');
      empty.textContent = '—';
      this.listElement.appendChild(empty);
      return;
    }
    this.visibleItems.forEach((item, index) => {
      const row = document.createElement('li');
      row.classList.add('list-item', 'two-lines');
      if (index === this.selectedIndex) row.classList.add('selected');

      const primary = document.createElement('div');
      primary.classList.add('primary-line');
      primary.textContent = item.label;

      const secondary = document.createElement('div');
      secondary.classList.add('secondary-line');
      secondary.textContent = item.description || '';

      row.append(primary, secondary);
      row.addEventListener('click', () => {
        this.selectedIndex = index;
        this.confirm();
      });
      row.addEventListener('mousemove', () => {
        if (this.selectedIndex !== index) {
          this.selectedIndex = index;
          this.updateSelectionClasses();
        }
      });
      this.listElement.appendChild(row);
    });
    this.scrollSelectedIntoView();
  }

  updateSelectionClasses() {
    const rows = this.listElement.querySelectorAll('li.list-item');
    rows.forEach((row, index) => row.classList.toggle('selected', index === this.selectedIndex));
    this.scrollSelectedIntoView();
  }

  scrollSelectedIntoView() {
    const rows = this.listElement.querySelectorAll('li.list-item');
    const row = rows[this.selectedIndex];
    if (row && row.scrollIntoView) row.scrollIntoView({ block: 'nearest' });
  }

  moveSelection(delta) {
    if (this.visibleItems.length === 0) return;
    const count = this.visibleItems.length;
    this.selectedIndex = (this.selectedIndex + delta + count) % count;
    this.updateSelectionClasses();
  }

  confirm() {
    const item = this.visibleItems[this.selectedIndex];
    if (!item) return;
    const callback = this.onConfirm;
    this.dispose();
    if (callback) callback(item.value, item);
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
    if (this.filterEditor) this.filterEditor.destroy();
  }
}
