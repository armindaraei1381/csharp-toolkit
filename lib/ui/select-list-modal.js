'use babel';

/**
 * SelectListModal — a filtered, keyboard-navigable QuickPick-style modal
 * (Pulsar has no native QuickPick). Visual language follows Pulsar's command
 * palette, redesigned in 0.3.1 with a glassmorphism panel: header badge,
 * per-template category icons & accent colors, short-name chips, a live
 * result counter and keyboard hints in the footer.
 *
 * Keys: type to filter, ↑/↓ to move, Enter to confirm, Esc to cancel.
 * Mouse: move to highlight, click to confirm.
 *
 * Public API and CSS class names are unchanged from 0.3.0.
 *
 * Author: Armin Daraei
 */

import { CompositeDisposable } from 'atom';
import i18n from '../core/i18n';

/** Category → (Octicon, accent class). First match wins. */
const CATEGORY_VISUALS = [
  { test: /maui/i,                    icon: 'device-mobile',  accent: 'teal' },
  { test: /blazor|webassembly/i,      icon: 'globe',          accent: 'violet' },
  { test: /grpc/i,                    icon: 'broadcast',      accent: 'cyan' },
  { test: /webapi|web-?api/i,         icon: 'cloud',          accent: 'blue' },
  { test: /mvc|webapp|razor|web/i,    icon: 'browser',        accent: 'blue' },
  { test: /xunit|nunit|mstest|test/i, icon: 'beaker',         accent: 'violet' },
  { test: /console/i,                 icon: 'terminal',       accent: 'green' },
  { test: /classlib|library/i,        icon: 'file-directory', accent: 'orange' },
  { test: /sln|solution/i,            icon: 'repo',           accent: 'gray' }
];

function templateVisual(value = '', text = '') {
  const hay = `${value} ${text}`;
  for (const visual of CATEGORY_VISUALS) {
    if (visual.test.test(hay)) return visual;
  }
  return { icon: 'file-code', accent: 'gray' };
}

export default class SelectListModal {
  /**
   * @param {object} options
   * @param {Array<{label, description?, value}>} options.items
   * @param {string}   [options.prompt]          kept for API compatibility;
   *                                               the header uses i18n strings
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

    // ── Header ──
    const header = document.createElement('div');
    header.classList.add('csharp-toolkit-select-header');

    const badge = document.createElement('div');
    badge.classList.add('header-badge');
    badge.appendChild(this.buildIcon('rocket'));

    const headerText = document.createElement('div');
    headerText.classList.add('header-text');
    const title = document.createElement('div');
    title.classList.add('header-title');
    title.textContent = i18n.t('createProject.pickerTitle');
    const subtitle = document.createElement('div');
    subtitle.classList.add('header-subtitle');
    subtitle.textContent = i18n.t('createProject.pickerSubtitle');
    headerText.append(title, subtitle);

    header.append(badge, headerText);
    this.element.appendChild(header);

    // ── Filter input ──
    this.filterEditor = atom.workspace.buildTextEditor({
      mini: true,
      placeholderText: this.placeholderText,
      softWrapped: false
    });
    this.element.appendChild(this.filterEditor.getElement());

    // ── List ──
    this.listElement = document.createElement('ol');
    this.listElement.classList.add('list-group', 'csharp-toolkit-select-list');
    this.element.appendChild(this.listElement);

    // ── Footer (hints + live counter) ──
    const footer = document.createElement('div');
    footer.classList.add('csharp-toolkit-select-footer');

    const hints = document.createElement('div');
    hints.classList.add('hints');
    hints.append(
      this.buildHint(['↑', '↓'], i18n.t('createProject.hintNavigate')),
      this.buildHint(['↵'], i18n.t('createProject.hintSelect')),
      this.buildHint(['Esc'], i18n.t('createProject.hintCancel'))
    );

    this.footerCount = document.createElement('div');
    this.footerCount.classList.add('count');

    footer.append(hints, this.footerCount);
    this.element.appendChild(footer);

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

  buildIcon(name) {
    const span = document.createElement('span');
    span.classList.add('icon', `icon-${name}`);
    return span;
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

  /** Strips the short-name prefix the command puts into `description`. */
  tagsTextFor(item) {
    let tags = item.description || '';
    if (item.value && tags.startsWith(item.value)) {
      tags = tags.slice(item.value.length).replace(/^[\s—–-]+/, '');
    }
    return tags.trim();
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
      row.classList.add('list-item', 'csharp-toolkit-template-row');
      if (index === this.selectedIndex) row.classList.add('selected');

      const visual = templateVisual(item.value, item.description || item.label);

      const iconBadge = document.createElement('span');
      iconBadge.classList.add('template-icon', `accent-${visual.accent}`);
      iconBadge.appendChild(this.buildIcon(visual.icon));

      const content = document.createElement('div');
      content.classList.add('template-content');

      const name = document.createElement('div');
      name.classList.add('template-name');
      name.textContent = item.label;

      const meta = document.createElement('div');
      meta.classList.add('template-meta');
      if (item.value) {
        const chip = document.createElement('span');
        chip.classList.add('chip', `accent-${visual.accent}`);
        chip.textContent = item.value;
        meta.appendChild(chip);
      }
      const tags = this.tagsTextFor(item);
      if (tags) {
        const tagsSpan = document.createElement('span');
        tagsSpan.classList.add('template-tags');
        tagsSpan.textContent = tags;
        meta.appendChild(tagsSpan);
      }

      content.append(name, meta);

      const chevron = document.createElement('span');
      chevron.classList.add('row-chevron');
      chevron.appendChild(this.buildIcon('chevron-right'));

      row.append(iconBadge, content, chevron);
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
