'use babel';

/**
 * TemplateEngine — loads `.cs.template` files, substitutes `${placeholder}`
 * variables and applies the user's style preferences (brace style,
 * file-scoped namespace, nullable directive).
 *
 * Author: Armin Daraei
 */

import fs from 'fs';

export default class TemplateEngine {
  /** Replaces `${name}` placeholders; unknown placeholders are left intact. */
  static render(template, variables = {}) {
    return template.replace(/\$\{(\w+)\}/g, (match, key) =>
      Object.prototype.hasOwnProperty.call(variables, key) ? String(variables[key]) : match
    );
  }

  static loadTemplate(templatePath) {
    return fs.readFileSync(templatePath, 'utf8');
  }

  /** Converts Allman templates to K&R by lifting `{` onto the previous line. */
  static applyBraceStyle(code, style) {
    if (!code || style !== 'k&r') return code;
    return code.replace(/([^\r\n]*?)\r?\n[ \t]*\{/g, (match, previousLine) => `${previousLine} {`);
  }

  /**
   * Converts `namespace X { ... }` into `namespace X;` (C# 10+), de-indenting
   * the body by one level. Anything that is already file-scoped (or does not
   * match the expected shape) is returned unchanged. Lines before the
   * namespace (e.g. `using` directives) are preserved.
   */
  static toFileScopedNamespace(code) {
    if (!code) return code;

    const lines = code.replace(/\r\n/g, '\n').split('\n');
    const nsIndex = lines.findIndex((line) =>
      /^[ \t]*namespace\s+[\w.]+[ \t]*\{?[ \t]*$/.test(line)
    );
    if (nsIndex === -1) return code;

    const nsLine = lines[nsIndex];
    const nsName = nsLine.trim().replace(/^namespace[ \t]+/, '').replace(/\{[ \t]*$/, '').trim();
    const inlineBrace = /\{[ \t]*$/.test(nsLine);

    let bodyStart;
    if (inlineBrace) {
      bodyStart = nsIndex + 1;
    } else {
      const openLine = lines[nsIndex + 1] || '';
      if (!/^[ \t]*\{[ \t]*$/.test(openLine)) return code;
      bodyStart = nsIndex + 2;
    }

    let bodyEnd = lines.length - 1;
    while (bodyEnd >= 0 && lines[bodyEnd].trim() === '') bodyEnd--;
    if (bodyEnd < bodyStart || lines[bodyEnd].trim() !== '}') return code;

    const header = lines.slice(0, nsIndex);
    const body = lines
      .slice(bodyStart, bodyEnd)
      .map((line) => line.replace(/^(\t| {4})/, ''));

    const output = [...header];
    if (output.length > 0 && output[output.length - 1].trim() !== '') output.push('');
    output.push(`namespace ${nsName};`, '', ...body);

    return `${output.join('\n').replace(/[ \t]+$/gm, '').replace(/\n+$/, '')}\n`;
  }

  /** Prepends `#nullable enable` (idempotent). */
  static prependNullableDirective(code) {
    if (!code) return code;
    if (/^[ \t]*#nullable\b/m.test(code)) return code;
    return `#nullable enable\n\n${code}`;
  }

  /**
   * Full pipeline: render → brace style → namespace style → nullable →
   * whitespace cleanup.
   */
  static buildFile({
    template,
    variables = {},
    namespaceStyle = 'block',
    braceStyle = 'allman',
    enableNullable = false
  }) {
    let code = this.render(template, variables);
    code = this.applyBraceStyle(code, braceStyle);
    if (namespaceStyle === 'file-scoped') code = this.toFileScopedNamespace(code);
    if (enableNullable) code = this.prependNullableDirective(code);
    return `${code.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim()}\n`;
  }
}
