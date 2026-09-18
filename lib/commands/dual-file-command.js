'use babel';

/**
 * DualFileCommand — generates the related file pairs (Razor Page, UWP
 * Page/Window/UserControl) on top of the existing NewFileCommand flow
 * (target dir → namespace resolution → input dialog) and the shared
 * DualFileGenerator core module.
 *
 * Author: Armin Daraei
 */

import path from 'path';
import fs from 'fs';

import NewFileCommand from './new-file-command';
import Validator from '../core/csharp-validator';
import DualFileGenerator from '../core/dual-file-generator';
import i18n from '../core/i18n';

const TEMPLATES_DIR = path.join(__dirname, '..', '..', 'templates');

/**
 * Kind registry: adding another file pair later means adding one entry here
 * plus one or two templates — nothing else.
 */
export const DUAL_FILE_KINDS = {
  'razor-page': {
    files: [
      { suffix: '.cshtml', templatePath: path.join(TEMPLATES_DIR, 'razor-page.cshtml.template'), primary: true },
      { suffix: '.cshtml.cs', templatePath: path.join(TEMPLATES_DIR, 'razor-page.cs.template') }
    ]
  },
  'uwp-page': {
    files: [
      { suffix: '.xaml', templatePath: path.join(TEMPLATES_DIR, 'uwp-page.xaml.template'), primary: true },
      {
        suffix: '.xaml.cs',
        templatePath: path.join(TEMPLATES_DIR, 'uwp-view.xaml.cs.template'),
        extraVariables: { basetype: 'Page' }
      }
    ]
  },
  'uwp-window': {
    files: [
      { suffix: '.xaml', templatePath: path.join(TEMPLATES_DIR, 'uwp-window.xaml.template'), primary: true },
      {
        suffix: '.xaml.cs',
        templatePath: path.join(TEMPLATES_DIR, 'uwp-view.xaml.cs.template'),
        extraVariables: { basetype: 'Window' }
      }
    ]
  },
  'uwp-usercontrol': {
    files: [
      { suffix: '.xaml', templatePath: path.join(TEMPLATES_DIR, 'uwp-usercontrol.xaml.template'), primary: true },
      {
        suffix: '.xaml.cs',
        templatePath: path.join(TEMPLATES_DIR, 'uwp-view.xaml.cs.template'),
        extraVariables: { basetype: 'UserControl' }
      }
    ]
  }
};

export default class DualFileCommand extends NewFileCommand {
  constructor(kind, options = {}) {
    super(kind, options);
    this.fileSpecs = DUAL_FILE_KINDS[kind].files;
    this.reveal = options.reveal || null;
  }

  fileNamesFor(baseName) {
    return this.fileSpecs.map((spec) => `${baseName}${spec.suffix}`);
  }

  /** Live "will create: Foo.cshtml + Foo.cshtml.cs" hint (overrides base). */
  fileHint(rawName) {
    const files = this.fileNamesFor(this.finalName(rawName)).join('  +  ');
    return i18n.t('dialog.fileHint', { file: files });
  }

  /** Both files of the pair must be collision-free. */
  validate(rawName) {
    const finalName = this.finalName(rawName);
    const result = Validator.validate(finalName);
    if (!result.valid) {
      return { valid: false, message: i18n.t(`validator.${result.reason}`, { keyword: result.keyword }) };
    }
    for (const fileName of this.fileNamesFor(finalName)) {
      if (fs.existsSync(path.join(this.targetDir, fileName))) {
        return { valid: false, message: i18n.t('error.exists', { file: fileName }) };
      }
    }
    return { valid: true };
  }

  async create(rawName) {
    const finalName = this.finalName(rawName);
    if (!Validator.validate(finalName).valid) return; // the dialog already showed the error

    try {
      const result = await DualFileGenerator.generate({
        baseName: finalName,
        targetDir: this.targetDir,
        namespace: this.nsInfo.namespace,
        fileSpecs: this.fileSpecs,
        variables: this.variables(finalName),
        namespaceStyle: this.config.namespaceStyle,
        braceStyle: this.config.braceStyle,
        enableNullable: this.config.enableNullable,
        reveal: this.reveal
      });

      if (result.collision) {
        atom.notifications.addError(
          i18n.t('error.exists', { file: path.basename(result.collision) })
        );
        return;
      }

      atom.notifications.addSuccess(
        i18n.t('success.createdPair', { name: finalName, count: String(result.written.length) })
      );
    } catch (error) {
      this.notifyError(error);
    }
  }
}
