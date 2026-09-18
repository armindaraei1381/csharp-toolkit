'use babel';

/**
 * ConstructorFromPropertiesCommand — parses the C# class under the cursor,
 * lists its settable properties (`set`/`init`, non-static) in a picker and
 * generates a constructor that assigns all selected properties, either as
 * a classic block or as an expression-bodied member.
 *
 * Bonus: it detects well-known property types whose namespaces are not
 * imported yet and adds (or offers to add) the missing `using` directives.
 *
 * Author: Armin Daraei
 */

import i18n from '../core/i18n';
import ConstructorPicker from '../ui/constructor-picker';
import { configKey } from '../core/package-meta';

const TYPE_NAMESPACE_MAP = {
  DateTime: 'System',
  DateTimeOffset: 'System',
  TimeSpan: 'System',
  Guid: 'System',
  Uri: 'System',
  StringComparison: 'System',
  CancellationToken: 'System.Threading',
  Task: 'System.Threading.Tasks',
  ValueTask: 'System.Threading.Tasks',
  List: 'System.Collections.Generic',
  Dictionary: 'System.Collections.Generic',
  IDictionary: 'System.Collections.Generic',
  IEnumerable: 'System.Collections.Generic',
  ICollection: 'System.Collections.Generic',
  IList: 'System.Collections.Generic',
  IReadOnlyList: 'System.Collections.Generic',
  IReadOnlyCollection: 'System.Collections.Generic',
  IReadOnlyDictionary: 'System.Collections.Generic',
  HashSet: 'System.Collections.Generic',
  Queue: 'System.Collections.Generic',
  Stack: 'System.Collections.Generic',
  KeyValuePair: 'System.Collections.Generic',
  ObservableCollection: 'System.Collections.ObjectModel',
  StringBuilder: 'System.Text',
  Encoding: 'System.Text',
  Regex: 'System.Text.RegularExpressions',
  Stream: 'System.IO',
  MemoryStream: 'System.IO',
  FileStream: 'System.IO',
  StreamReader: 'System.IO',
  StreamWriter: 'System.IO',
  Path: 'System.IO',
  File: 'System.IO',
  Directory: 'System.IO',
  HttpClient: 'System.Net.Http',
  HttpResponseMessage: 'System.Net.Http',
  Stopwatch: 'System.Diagnostics',
  ImmutableList: 'System.Collections.Immutable',
  ImmutableArray: 'System.Collections.Immutable',
  ImmutableDictionary: 'System.Collections.Immutable',
  ILogger: 'Microsoft.Extensions.Logging',
  IConfiguration: 'Microsoft.Extensions.Configuration',
  IServiceCollection: 'Microsoft.Extensions.DependencyInjection',
  DbContext: 'Microsoft.EntityFrameworkCore',
  DbSet: 'Microsoft.EntityFrameworkCore'
};

export default class ConstructorFromPropertiesCommand {
  constructor(options = {}) {
    this.expressionBodiedOption =
      options.expressionBodied !== undefined ? options.expressionBodied : false;
  }

  get expressionBodied() {
    return typeof this.expressionBodiedOption === 'function'
      ? !!this.expressionBodiedOption()
      : !!this.expressionBodiedOption;
  }

  get config() {
    return {
      confirmUsingDirectives: atom.config.get(configKey('confirmUsingDirectives'))
    };
  }

  run() {
    try {
      const editor = atom.workspace.getActiveTextEditor();
      if (!editor) {
        atom.notifications.addWarning(i18n.t('noEditor'));
        return;
      }
      const scopeName = editor.getGrammar() ? editor.getGrammar().scopeName : '';
      if (!scopeName.startsWith('source.cs')) {
        atom.notifications.addWarning(i18n.t('constructor.notCSharp'));
        return;
      }
      this.execute(editor);
    } catch (error) {
      this.notifyError(error);
    }
  }

  execute(editor) {
    const text = editor.getText();
    const cursorOffset = editor
      .getBuffer()
      .characterIndexForPosition(editor.getCursorBufferPosition());

    const classInfo = this.findTargetClass(text, cursorOffset);
    if (!classInfo) {
      atom.notifications.addWarning(i18n.t('constructor.noClass'));
      return;
    }

    const properties = this.findProperties(text.slice(classInfo.open + 1, classInfo.close));
    if (properties.length === 0) {
      atom.notifications.addInfo(i18n.t('constructor.noProperties'));
      return;
    }

    const picker = new ConstructorPicker({
      title: i18n.t('constructor.pickerTitle'),
      confirmLabel: i18n.t('constructor.add'),
      cancelLabel: i18n.t('button.cancel'),
      selectAllLabel: i18n.t('constructor.all'),
      selectNoneLabel: i18n.t('constructor.none'),
      rtl: i18n.isRTL(),
      properties,
      onConfirm: (selected) => {
        try {
          this.generate(editor, classInfo, selected);
        } catch (error) {
          this.notifyError(error);
        }
      }
    });
    picker.attach();
  }

  findTargetClass(text, cursorOffset) {
    const classes = [];
    const pattern =
      /(?:^|\n)[ \t]*(?:[\w.\[\]<>?]+[ \t]+)*(record(?:[ \t]+(?:struct|class))?|class|struct|interface)[ \t]+(\w+)[^{;]*\{/g;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const openBrace = match.index + match[0].length - 1;
      const closeBrace = this.findMatchingBrace(text, openBrace);
      if (closeBrace === -1) continue;
      classes.push({ name: match[2], start: match.index, open: openBrace, close: closeBrace });
    }
    if (classes.length === 0) return null;
    return classes.find((c) => cursorOffset > c.open && cursorOffset < c.close) || classes[0];
  }

  findProperties(bodyText) {
    const properties = [];
    const pattern =
      /(?:^|\n)[ \t]*(public|internal|protected|private)((?:[ \t]+(?:static|virtual|override|abstract|sealed|new|required))*)[ \t]+([\w.\[\]<>?, ]+?)[ \t]+(\w+)[ \t]*\{/g;
    let match;
    while ((match = pattern.exec(bodyText)) !== null) {
      if (/\bstatic\b/.test(match[2])) continue;
      const openBrace = match.index + match[0].length - 1;
      const closeBrace = this.findMatchingBrace(bodyText, openBrace);
      if (closeBrace === -1) continue;
      const accessorList = bodyText.slice(openBrace + 1, closeBrace);
      if (!/\b(?:set|init)\b/.test(accessorList)) continue;
      properties.push({ name: match[4], type: match[3].trim() });
    }
    return properties;
  }

  findMatchingBrace(text, openBraceIndex) {
    let depth = 0;
    for (let i = openBraceIndex; i < text.length; i++) {
      const character = text[i];
      if (character === '{') depth += 1;
      else if (character === '}') {
        depth -= 1;
        if (depth === 0) return i;
      }
    }
    return -1;
  }

  generate(editor, classInfo, selected) {
    if (!selected || selected.length === 0) {
      atom.notifications.addInfo(i18n.t('constructor.noneSelected'));
      return;
    }

    const text = editor.getText();
    const closeBrace = this.findMatchingBrace(text, classInfo.open);
    if (closeBrace === -1) {
      this.notifyError(new Error('The class body changed while the picker was open.'));
      return;
    }

    const indentUnit = editor.getTabText();
    const classRow = editor.getBuffer().positionForCharacterIndex(classInfo.start).row;
    const classIndent = (editor.lineTextForBufferRow(classRow).match(/^[ \t]*/) || [''])[0];
    const memberIndent = classIndent + indentUnit;

    const block = this.buildConstructor(classInfo.name, selected, {
      expressionBodied: this.expressionBodied,
      indent: memberIndent,
      indentUnit
    });

    const closeRow = editor.getBuffer().positionForCharacterIndex(closeBrace).row;
    const previousLine = closeRow > 0 ? (editor.lineTextForBufferRow(closeRow - 1) || '').trim() : '';
    const lead = previousLine.length > 0 ? '\n' : '';
    editor.getBuffer().insert([closeRow, 0], `${lead}${block}\n`);

    this.ensureUsingDirectives(editor, selected);

    atom.notifications.addSuccess(
      i18n.t('constructor.inserted', { count: String(selected.length), name: classInfo.name })
    );
  }

  buildConstructor(className, properties, { expressionBodied, indent, indentUnit }) {
    const params = properties
      .map((property) => `${property.type} ${this.paramNameFor(property.name)}`)
      .join(', ');

    if (expressionBodied) {
      const targets = properties.map((property) => property.name).join(', ');
      const values = properties.map((property) => this.paramNameFor(property.name)).join(', ');
      const assignment =
        properties.length === 1
          ? `${properties[0].name} = ${values}`
          : `(${targets}) = (${values})`;
      return `${indent}public ${className}(${params}) =>\n${indent}${indentUnit}${assignment};`;
    }

    const assignments = properties
      .map(
        (property) =>
          `${indent}${indentUnit}${property.name} = ${this.paramNameFor(property.name)};`
      )
      .join('\n');
    return `${indent}public ${className}(${params})\n${indent}{\n${assignments}\n${indent}}`;
  }

  paramNameFor(propertyName) {
    let name;
    if (/^[A-Z0-9_]+$/.test(propertyName)) {
      name = propertyName.toLowerCase();
    } else {
      name = propertyName.charAt(0).toLowerCase() + propertyName.slice(1);
    }
    const Validator = require('../core/csharp-validator').default;
    return Validator.RESERVED_KEYWORDS.has(name) ? `@${name}` : name;
  }

  baseTypeName(type) {
    return type
      .replace(/<[\s\S]*?>/g, '')
      .replace(/\[[^\]]*\]/g, '')
      .replace(/\?+$/, '')
      .trim()
      .split('.')
      .pop();
  }

  ensureUsingDirectives(editor, properties) {
    const text = editor.getText();
    const existing = new Set();
    const usingPattern = /^[ \t]*using[ \t]+(?:static[ \t]+)?([\w.]+)[ \t]*;/gm;
    let match;
    while ((match = usingPattern.exec(text)) !== null) existing.add(match[1]);

    const missing = new Set();
    for (const property of properties) {
      const namespace = TYPE_NAMESPACE_MAP[this.baseTypeName(property.type)];
      if (namespace && !existing.has(namespace)) missing.add(namespace);
    }
    if (missing.size === 0) return;

    const list = Array.from(missing).sort();

    if (this.config.confirmUsingDirectives) {
      const notification = atom.notifications.addWarning(
        i18n.t('constructor.missingUsings', { namespaces: list.join(', ') }),
        {
          dismissable: true,
          buttons: [
            {
              text: i18n.t('button.addUsings'),
              className: 'icon icon-plus',
              onDidClick: () => {
                this.insertUsings(editor, list);
                notification.dismiss();
              }
            },
            {
              text: i18n.t('button.skip'),
              className: 'icon icon-x',
              onDidClick: () => notification.dismiss()
            }
          ]
        }
      );
    } else {
      this.insertUsings(editor, list);
    }
  }

  insertUsings(editor, namespaces) {
    const lines = editor.getText().split('\n');
    let insertRow = 0;
    let afterExistingUsing = false;

    for (let i = 0; i < lines.length; i++) {
      if (/^[ \t]*using[ \t]+[\w.]+[ \t]*;[ \t]*$/.test(lines[i])) {
        insertRow = i + 1;
        afterExistingUsing = true;
      }
    }
    if (!afterExistingUsing) {
      for (let i = 0; i < lines.length; i++) {
        if (/^[ \t]*namespace\b/.test(lines[i])) {
          insertRow = i;
          break;
        }
      }
    }

    const statement = namespaces.map((ns) => `using ${ns};`).join('\n');
    const suffix = afterExistingUsing ? '\n' : '\n\n';
    editor.getBuffer().insert([insertRow, 0], `${statement}${suffix}`);
  }

  notifyError(error) {
    console.error('[csharp-toolkit]', error);
    atom.notifications.addError(
      i18n.t('error.unexpected', { message: error && error.message ? error.message : String(error) }),
      { stack: error && error.stack ? error.stack : undefined, dismissable: true }
    );
  }
}
