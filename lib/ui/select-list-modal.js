'use babel';

/**
 * SelectListModal — a filtered, keyboard-navigable selection modal built on
 * Pulsar's native modal panel and standard list classes (`list-group`,
 * `two-lines`, `primary-line`, `secondary-line`), so it looks and sizes
 * like the built-in command palette / fuzzy finder.
 *
 * Every row carries a template-type icon from Pulsar's built-in Octicon
 * set, resolved from the template's short name / label / tags. Only icons
 * that actually exist in Pulsar's Octicon set are used (e.g. there is no
 * plain `cloud` — Web API uses `server` instead, and the Native AOT
 * templates get `zap`). Unknown templates fall back to `file-code`.
 *
 * Keys: type to filter, ↑/↓ to move, Enter to confirm, Esc to cancel.
 * Mouse: move to highlight, click to confirm.
 *
 * Author: Armin Daraei
 */

import { CompositeDisposable } from 'atom';
import i18n from '../core/i18n';

/**
 * Octicon mapping — first match wins. Matched against the short name,
 * label and tags so both the live `dotnet new list` output and the curated
 * fallback list resolve to a sensible icon.
 */
const TEMPLATE_ICONS = [
  { test: /aot/i,                                icon: 'zap' },
  { test: /maui/i,                               icon: 'device-mobile' },
  { test: /grpc/i,                               icon: 'broadcast' },
  { test: /webapi|web-?api/i,                    icon: 'server' },
  { test: /blazor|webassembly/i,                 icon: 'globe' },
  { test: /classlib|library/i,                   icon: 'book' },
  { test: /mvc|webapp|\bweb\b|razor|webconfig/i, icon: 'browser' },
  { test: /test|xunit|nunit|mstest/i,            icon: 'beaker' },
  { test: /console/i,                            icon: 'terminal' },
  { test: /sln|solution/i,                       icon: 'repo' },
  { test: /worker|service/i,                     icon: 'tools' },
  { test: /nuget|pack/i,                         icon: 'package' },
  { test: /gitignore|editorconfig|tool|manifest|props|targets/i, icon: 'gear' }
];

function templateIcon(item) {
  const haystack = `${item.value || ''} ${item.label || ''} ${item.description || ''}`.toLowerCase();
  for (const entry of TEMPLATE_ICONS) {
    if (entry.test.test(haystack)) return entry.icon;
  }
  return 'file-code';
}

export default class SelectListModal {
  /**
   * @param {object} options
   * @param {Array<{label, description?, value}>} options.items
   * @param {string}   [options.prompt]          accepted for API compatibility
   * @param {string}   [options.placeholderText]
   * @param {boolean}  [options.rtl]
   * @param {Function} [options.onConfirm]       receives (value, item)
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

    // Filter input — styled natively by the theme inside atom-panel.modal.
    this.filterEditor = atom.workspace.buildTextEditor({
      mini: true,
      placeholderText: this.placeholderText,
      softWrapped: false
    });
    this.element.appendChild(this.filterEditor.getElement());

    // Results list — same structure as the fuzzy finder, plus an icon column.
    this.listElement = document.createElement('ol');
    this.listElement.classList.add('list-group');
    this.element.appendChild(this.listElement);

    // Slim footer: keyboard hints (left) + live result counter (right).
    const footer = document.createElement('div');
    footer.classList.add('csharp-toolkit-select-footer');

    const hints = document.createElement('span');
    hints.classList.add('hints');
    hints.append(
      this.buildHint(['↑', '↓'], i18n.t('createProject.hintNavigate')),
      this.buildHint(['↵'], i18n.t('createProject.hintSelect')),
      this.buildHint(['Esc'], i18n.t('createProject.hintCancel'))
    );

    this.footerCount = document.createElement('span');
    this.footerCount.classList.add('count');

    footer.append(hints, this.footerCount);
    this.element.appendChild(footer);

    this.panel = atom.workspace.addModalPanel({
      item: this.element,
      visible: true,
      priority: 400
    });
    // Tag the host panel so the stylesheet can adjust padding explicitly.
    this.panel.element.classList.add('csharp-toolkit-select-list-host');

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

  buildHint(keys, label) {
    const hint = document.createElement('span');
    hint.classList.add('hint');
    for (const key of keys) {
      const kbd = document.createElement('kbd');
      kbd.textContent = key;
      hint.appendChild(kbd);
    }
    const text = document.createElement('span');
    text.textContent = label;
    hint.appendChild(text);
    return hint;
  }

  applyFilter() {
    const query = this.filterEditor.getText().trim().toLowerCase();
    const scored = [];
    for (const item of this.items) {
      const haystack = `${item.label} ${item.description || ''} ${item.value || ''}`.toLowerCase();
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
      empty.textContent = i18n.t('createProject.noMatches');
      this.listElement.appendChild(empty);
      this.updateFooterCount();
      return;
    }

    this.visibleItems.forEach((item, index) => {
      const row = document.createElement('li');
      row.classList.add('list-item', 'two-lines', 'csharp-toolkit-template-row');
      if (index === this.selectedIndex) row.classList.add('selected');

      const icon = document.createElement('span');
      icon.classList.add('template-icon', 'icon', `icon-${templateIcon(item)}`);

      const content = document.createElement('div');
      content.classList.add('template-content');

      const primary = document.createElement('div');
      primary.classList.add('primary-line');
      primary.textContent = item.label;

      const secondary = document.createElement('div');
      secondary.classList.add('secondary-line');
      secondary.textContent = item.description || '';

      content.append(primary, secondary);
      row.append(icon, content);

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

    this.updateFooterCount();
    this.scrollSelectedIntoView();
  }

  updateFooterCount() {
    if (this.footerCount) {
      this.footerCount.textContent = i18n.t('createProject.footerCount', {
        shown: String(this.visibleItems.length),
        total: String(this.items.length)
      });
    }
  }

  updateSelectionClasses() {
    const rows = this.listElement.querySelectorAll('li.csharp-toolkit-template-row');
    rows.forEach((row, index) => row.classList.toggle('selected', index === this.selectedIndex));
    this.scrollSelectedIntoView();
  }

  scrollSelectedIntoView() {
    const rows = this.listElement.querySelectorAll('li.csharp-toolkit-template-row');
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
