'use babel';

/**
 * CSharpValidator — validates user input against C# identifier rules:
 * legal characters, no leading digit, no collision with reserved or
 * contextual keywords, support for verbatim (`@`) identifiers and
 * Unicode letters.
 *
 * Author: Armin Daraei
 */

const RESERVED_KEYWORDS = new Set([
  'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch', 'char',
  'checked', 'class', 'const', 'continue', 'decimal', 'default', 'delegate',
  'do', 'double', 'else', 'enum', 'event', 'explicit', 'extern', 'false',
  'finally', 'fixed', 'float', 'for', 'foreach', 'goto', 'if', 'implicit',
  'in', 'int', 'interface', 'internal', 'is', 'lock', 'long', 'namespace',
  'new', 'null', 'object', 'operator', 'out', 'override', 'params', 'private',
  'protected', 'public', 'readonly', 'ref', 'return', 'sbyte', 'sealed',
  'short', 'sizeof', 'stackalloc', 'static', 'string', 'struct', 'switch',
  'this', 'throw', 'true', 'try', 'typeof', 'uint', 'ulong', 'unchecked',
  'unsafe', 'ushort', 'using', 'virtual', 'void', 'volatile', 'while'
]);

const CONTEXTUAL_KEYWORDS = new Set([
  'add', 'alias', 'and', 'ascending', 'async', 'await', 'by', 'descending',
  'dynamic', 'equals', 'file', 'from', 'get', 'global', 'group', 'init',
  'into', 'join', 'let', 'managed', 'nameof', 'nint', 'not', 'notnull', 'on',
  'or', 'orderby', 'partial', 'record', 'remove', 'required', 'scoped',
  'select', 'set', 'unmanaged', 'value', 'var', 'when', 'where', 'with', 'yield'
]);

// C# identifiers: a Unicode letter or `_` first, then letters / digits / `_`.
const IDENTIFIER_PATTERN = /^[\p{L}_][\p{L}\p{N}_]*$/u;

// Characters that are illegal in file names on at least one supported OS.
const INVALID_FILE_NAME_CHARS = /[\\/:*?"<>|]/;

export default class CSharpValidator {
  static get RESERVED_KEYWORDS() {
    return RESERVED_KEYWORDS;
  }

  static get CONTEXTUAL_KEYWORDS() {
    return CONTEXTUAL_KEYWORDS;
  }

  static isReserved(word) {
    return RESERVED_KEYWORDS.has(String(word).toLowerCase());
  }

  /**
   * @returns {{valid: boolean, value?: string, verbatim?: boolean,
   *            reason?: 'empty'|'filename'|'start'|'char'|'reserved'|'contextual',
   *            keyword?: string}}
   */
  static validate(rawName) {
    if (typeof rawName !== 'string' || rawName.trim().length === 0) {
      return { valid: false, reason: 'empty' };
    }

    const trimmed = rawName.trim();

    if (INVALID_FILE_NAME_CHARS.test(trimmed)) {
      return { valid: false, reason: 'filename' };
    }

    let identifier = trimmed;
    let verbatim = false;
    if (identifier.startsWith('@')) {
      verbatim = true;
      identifier = identifier.slice(1);
    }

    if (identifier.length === 0) return { valid: false, reason: 'empty' };

    if (!IDENTIFIER_PATTERN.test(identifier)) {
      if (/^\p{N}/u.test(identifier)) return { valid: false, reason: 'start' };
      return { valid: false, reason: 'char' };
    }

    // Keywords are lowercase; identifiers are case-sensitive, so `Class`
    // is a perfectly legal name while `class` is not.
    if (!verbatim && RESERVED_KEYWORDS.has(identifier)) {
      return { valid: false, reason: 'reserved', keyword: identifier };
    }
    if (!verbatim && CONTEXTUAL_KEYWORDS.has(identifier)) {
      return { valid: false, reason: 'contextual', keyword: identifier };
    }

    return { valid: true, value: trimmed, verbatim };
  }
}
