'use babel';

import TemplateEngine from '../lib/core/template-engine';

const CLASS_TEMPLATE =
  'namespace ${namespace}\n{\n    public class ${classname}\n    {\n    }\n}\n';

describe('TemplateEngine', () => {
  describe('render()', () => {
    it('substitutes known placeholders', () => {
      const output = TemplateEngine.render(
        'namespace ${namespace} { class ${classname} {} }',
        { namespace: 'App.Services', classname: 'User' }
      );
      expect(output).toBe('namespace App.Services { class User {} }');
    });

    it('leaves unknown placeholders intact', () => {
      const output = TemplateEngine.render('Hello ${unknown}', {});
      expect(output).toBe('Hello ${unknown}');
    });
  });

  describe('applyBraceStyle()', () => {
    it('converts Allman to K&R', () => {
      const code = 'namespace App\n{\n    public class Foo\n    {\n    }\n}\n';
      const output = TemplateEngine.applyBraceStyle(code, 'k&r');
      expect(output).toBe('namespace App {\n    public class Foo {\n    }\n}\n');
    });

    it('leaves Allman code untouched', () => {
      const code = CLASS_TEMPLATE;
      expect(TemplateEngine.applyBraceStyle(code, 'allman')).toBe(code);
    });
  });

  describe('toFileScopedNamespace()', () => {
    it('converts a block namespace and de-indents the body', () => {
      const code = 'namespace App\n{\n    public class Foo\n    {\n    }\n}\n';
      const output = TemplateEngine.toFileScopedNamespace(code);
      expect(output).toBe('namespace App;\n\npublic class Foo\n{\n}\n');
    });

    it('preserves lines before the namespace (usings)', () => {
      const code = 'using System;\n\nnamespace App\n{\n    public class Foo\n    {\n    }\n}\n';
      const output = TemplateEngine.toFileScopedNamespace(code);
      expect(output).toBe('using System;\n\nnamespace App;\n\npublic class Foo\n{\n}\n');
    });

    it('returns the input unchanged when there is no block namespace', () => {
      const code = 'namespace App;\n\npublic class Foo\n{\n}\n';
      expect(TemplateEngine.toFileScopedNamespace(code)).toBe(code);
    });
  });

  describe('prependNullableDirective()', () => {
    it('prepends the directive', () => {
      const output = TemplateEngine.prependNullableDirective('public class Foo {}\n');
      expect(output).toBe('#nullable enable\n\npublic class Foo {}\n');
    });

    it('is idempotent', () => {
      const once = TemplateEngine.prependNullableDirective('public class Foo {}\n');
      expect(TemplateEngine.prependNullableDirective(once)).toBe(once);
    });
  });

  describe('buildFile()', () => {
    it('runs the full pipeline: render → K&R → file-scoped → nullable', () => {
      const output = TemplateEngine.buildFile({
        template: CLASS_TEMPLATE,
        variables: { namespace: 'App', classname: 'Foo' },
        namespaceStyle: 'file-scoped',
        braceStyle: 'k&r',
        enableNullable: true
      });
      expect(output).toBe('#nullable enable\n\nnamespace App;\n\npublic class Foo {\n}\n');
    });
  });
});
