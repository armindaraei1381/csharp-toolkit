'use babel';

/**
 * NewFileCommand — generic handler for all "New C# …" commands.
 *
 * Flow: resolve target directory → resolve namespace → open the input
 * dialog (live validation) → render the template → write the file →
 * open it in Pulsar → success notification.
 *
 * Author: Armin Daraei
 */

import path from 'path';
import fs from 'fs';

import NamespaceResolver from '../core/namespace-resolver';
import TemplateEngine from '../core/template-engine';
import Validator from '../core/csharp-validator';
import InputDialog from '../ui/input-dialog';
import i18n from '../core/i18n';

const DEFAULT_NAMES = {
  class: 'NewClass',
  interface: 'NewInterface',
  enum: 'NewEnum',
  struct: 'NewStruct',
  'abstract-class': 'NewAbstractClass',
  'static-class': 'NewStaticClass',
  record: 'NewRecord',
  'record-struct': 'NewRecordStruct',
  'unit-test': 'NewTests',
  custom: 'NewItem',
  // ── added in 0.2.0 ──
  'mvc-controller': 'NewController',
  'api-controller': 'NewApiController',
  'razor-page': 'NewPage',
  'uwp-page': 'NewPage',
  'uwp-window': 'NewWindow',
  'uwp-usercontrol': 'NewUserControl',
  'uwp-resource': 'NewResource',
  'xunit-test': 'NewTests',
  'nunit-test': 'NewTests',
  'mstest-test': 'NewTests'
};

const TEST_FRAMEWORK_SNIPPETS = {
  xunit: {
    testusing: 'using Xunit;',
    testclassattribute: '',
    testmethodattribute: '[Fact]',
    asserttrue: 'Assert.True(true);'
  },
  mstest: {
    testusing: 'using Microsoft.VisualStudio.TestTools.UnitTesting;',
    testclassattribute: '[TestClass]',
    testmethodattribute: '[TestMethod]',
    asserttrue: 'Assert.IsTrue(true);'
  },
  nunit: {
    testusing: 'using NUnit.Framework;',
    testclassattribute: '[TestFixture]',
    testmethodattribute: '[Test]',
    asserttrue: 'Assert.That(true, Is.True);'
  }
};

export default class NewFileCommand {
  constructor(kind, options = {}) {
    this.kind = kind;
    this.fileExtension = options.fileExtension || 'cs';
    this.getTargetPath = options.getTargetPath || (() => null);
    this.templatePath =
      options.templatePath || path.join(__dirname, '..', '..', 'templates', `${kind}.cs.template`);
  }

  get config() {
    return {
      namespaceStyle: atom.config.get('csharpextensions-pulsar.namespaceStyle'),
      enableNullable: atom.config.get('csharpextensions-pulsar.enableNullable'),
      interfacePrefix: atom.config.get('csharpextensions-pulsar.interfacePrefix'),
      braceStyle: atom.config.get('csharpextensions-pulsar.braceStyle'),
      testFramework: atom.config.get('csharpextensions-pulsar.testFramework')
    };
  }

  run(event) {
    try {
      this.execute(event);
    } catch (error) {
      this.notifyError(error);
    }
  }

  execute(event) {
    const targetPath = this.getTargetPath(event);
    this.targetDir = this.resolveTargetDirectory(targetPath);
    if (!this.targetDir) {
      atom.notifications.addError(i18n.t('error.noTarget'));
      return;
    }

    this.nsInfo = NamespaceResolver.resolve(this.targetDir, atom.project.getPaths());
    if (!this.nsInfo) {
      atom.notifications.addError(i18n.t('error.noNamespace'));
      return;
    }
    if (this.nsInfo.source === 'workspace') {
      atom.notifications.addInfo(
        i18n.t('info.namespaceFallback', { namespace: this.nsInfo.namespace })
      );
    }
    if (this.nsInfo.ambiguous) {
      atom.notifications.addWarning(
        i18n.t('warning.ambiguousProject', { file: this.nsInfo.projectFileName })
      );
    }

    const dialog = new InputDialog({
      prompt: i18n.t('dialog.prompt', { kind: i18n.t(`kind.${this.kind}`) }),
      initialValue: this.initialName(),
      placeholderText: i18n.t('dialog.placeholder'),
      rtl: i18n.isRTL(),
      validate: (value) => this.validate(value),
      hint: (value) => this.fileHint(value),
      onConfirm: (value) => this.create(value)
    });
    dialog.attach();
  }

  resolveTargetDirectory(targetPath) {
    if (!targetPath) return null;
    try {
      return fs.statSync(targetPath).isDirectory() ? targetPath : path.dirname(targetPath);
    } catch (error) {
      return null;
    }
  }

  initialName() {
    const name = DEFAULT_NAMES[this.kind] || 'NewItem';
    return this.kind === 'interface' ? this.applyInterfacePrefix(name) : name;
  }

  applyInterfacePrefix(name) {
    if (this.kind !== 'interface') return name;
    const prefix = (this.config.interfacePrefix || '').trim();
    if (!prefix || name.startsWith('@') || name.startsWith(prefix)) return name;
    return `${prefix}${name}`;
  }

  finalName(rawName) {
    const result = Validator.validate(rawName);
    if (!result.valid) return rawName;
    return this.applyInterfacePrefix(result.value);
  }

  fileHint(rawName) {
    return i18n.t('dialog.fileHint', { file: `${this.finalName(rawName)}.${this.fileExtension}` });
  }

  validate(rawName) {
    const finalName = this.finalName(rawName);
    const result = Validator.validate(finalName);
    if (!result.valid) {
      return {
        valid: false,
        message: i18n.t(`validator.${result.reason}`, { keyword: result.keyword })
      };
    }
    const filePath = path.join(this.targetDir, `${finalName}.${this.fileExtension}`);
    if (fs.existsSync(filePath)) {
      return {
        valid: false,
        message: i18n.t('error.exists', { file: `${finalName}.${this.fileExtension}` })
      };
    }
    return { valid: true };
  }

  create(rawName) {
    const finalName = this.finalName(rawName);
    const result = Validator.validate(finalName);
    if (!result.valid) return; // the dialog already showed the error

    let template;
    try {
      template = TemplateEngine.loadTemplate(this.templatePath);
    } catch (error) {
      atom.notifications.addError(i18n.t('error.templateRead', { path: this.templatePath }), {
        dismissable: true
      });
      return;
    }

    const content = TemplateEngine.buildFile({
      template,
      variables: this.variables(finalName),
      namespaceStyle: this.config.namespaceStyle,
      braceStyle: this.config.braceStyle,
      enableNullable: this.fileExtension === 'cs' ? this.config.enableNullable : false
    });

    const filePath = path.join(this.targetDir, `${finalName}.${this.fileExtension}`);
    try {
      fs.writeFileSync(filePath, content, { encoding: 'utf8' });
    } catch (error) {
      atom.notifications.addError(
        i18n.t('error.write', { path: filePath, message: error.message }),
        { dismissable: true }
      );
      return;
    }

    atom.workspace.open(filePath);
    atom.notifications.addSuccess(
      i18n.t('success.created', { kind: i18n.t(`kind.${this.kind}`), name: finalName })
    );
  }

  variables(className) {
    const now = new Date();
    const variables = {
      namespace: this.nsInfo.namespace,
      classname: className,
      year: String(now.getFullYear()),
      date: now.toISOString().slice(0, 10)
    };
    if (this.kind === 'unit-test') {
      const snippets = TEST_FRAMEWORK_SNIPPETS[this.config.testFramework] || TEST_FRAMEWORK_SNIPPETS.xunit;
      Object.assign(variables, snippets, { testmethodname: 'Test1' });
    }
    return variables;
  }

  notifyError(error) {
    console.error('[csharpextensions-pulsar]', error);
    atom.notifications.addError(
      i18n.t('error.unexpected', { message: error && error.message ? error.message : String(error) }),
      { stack: error && error.stack ? error.stack : undefined, dismissable: true }
    );
  }
}
