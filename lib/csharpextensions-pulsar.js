'use babel';

import CsharpextensionsPulsarView from './csharpextensions-pulsar-view';
import { CompositeDisposable } from 'atom';

export default {

  csharpextensionsPulsarView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.csharpextensionsPulsarView = new CsharpextensionsPulsarView(state.csharpextensionsPulsarViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.csharpextensionsPulsarView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'csharpextensions-pulsar:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.csharpextensionsPulsarView.destroy();
  },

  serialize() {
    return {
      csharpextensionsPulsarViewState: this.csharpextensionsPulsarView.serialize()
    };
  },

  toggle() {
    console.log('CsharpextensionsPulsar was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};
