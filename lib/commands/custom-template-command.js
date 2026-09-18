'use babel';

/**
 * CustomTemplateCommand — runs a user template from
 * `~/.pulsar/csharpextensions-templates/` with the same variable set as
 * the built-in templates (namespace, classname, year, date).
 *
 * Author: Armin Daraei
 */

import NewFileCommand from './new-file-command';

export default class CustomTemplateCommand extends NewFileCommand {
  constructor({ id, templatePath }, options = {}) {
    super('custom', { ...options, templatePath });
    this.id = id;
  }

  // Custom templates never get an interface prefix.
  applyInterfacePrefix(name) {
    return name;
  }
}
