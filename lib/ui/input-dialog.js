'use babel';

/**
 * InputDialog — a modal name-input dialog built on a mini TextEditor,
 * because Pulsar has no native `showInputBox`. Handles Enter (confirm),
 * Escape (cancel), live validation and a live "will create …" hint.
 *
 * Inspired by the modal-input pattern of classic Atom packages such as
 * `advanced-open-file`.
 *
 * Author: Armin Daraei
 */

import { CompositeDisposable } from 'atom';

export default class InputDialog {
  constructor({
    prompt,
    initialValue = '',
    placeholderText = '',
    validate = null,
    hint = null,
    onConfirm = null,
    onCancel = null,
    rtl = false
  }) {
    this.prompt = prompt;
    this.initialValue = initialValue;
    this.placeholderText = placeholderText;
    this.validate = validate || (() => ({ valid: true }));
    this.hint = hint;
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
    this.rtl = rtl;
    this.disposables = new CompositeDisposable();
    this.disposed = false;
  }

  attach() {
    this.editor = atom.workspace.buildTextEditor({
      mini: true,
      placeholderText: this.placeholderText,
      softWrapped: false
    });

    this.element = document.createElement('div');
    this.element.classList.add('csharpextensions-input-dialog');
    if (this.rtl) this.element.setAttribute('dir', 'rtl');

    const label = document.createElement('label');
    label.classList.add('csharpextensions-input-dialog-prompt', 'icon', 'icon-file-code');
    label.textContent = this.prompt;
    this.element.appendChild(label);

    this.element.appendChild(this.editor.getElement());

    this.message = document.createElement('div');
    this.message.classList.add('csharpextensions-input-dialog-message');
    this.element.appendChild(this.message);

    this.panel = atom.workspace.addModalPanel({
      item: this.element,
      visible: true,
      priority: 400
    });

    const editorElement = this.editor.getElement();
    this.disposables.add(
      atom.commands.add(editorElement, {
        'core:confirm': () => this.confirm(),
        'core:cancel': () => this.cancel(),
        'core:close': () => this.cancel()
      }),
      this.editor.onDidChange(() => this.refresh())
    );

    if (this.initialValue) {
      this.editor.setText(this.initialValue);
      this.editor.selectAll();
    }

    editorElement.focus();
  }

  refresh() {
    const value = this.editor.getText();
    if (value.trim().length === 0) {
      this.setMessage('', '');
      return;
    }
    const result = this.validate(value);
    if (!result.valid) {
      this.setMessage(result.message || '', 'error');
    } else {
      this.setMessage(this.hint ? this.hint(value) : '', 'hint');
    }
  }

  setMessage(text, kind) {
    this.message.textContent = text;
    this.message.classList.toggle('error', kind === 'error');
    this.message.classList.toggle('hint', kind === 'hint');
  }

  confirm() {
    const value = this.editor.getText().trim();
    const result = this.validate(value);
    if (!result.valid) {
      this.setMessage(result.message || '', 'error');
      this.editor.getElement().focus();
      return;
    }
    const callback = this.onConfirm;
    this.dispose();
    if (callback) callback(value);
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
    if (this.editor) this.editor.destroy();
  }
}
