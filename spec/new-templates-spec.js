'use babel';

import path from 'path';

import TemplateEngine from '../lib/core/template-engine';

const TEMPLATES = path.join(__dirname, '..', 'templates');

const VARIABLES = {
  namespace: 'App.Services',
  classname: 'Foo',
  testmethodname: 'Test1'
};

function build(templateName, extraVariables = {}, options = {}) {
  const template = TemplateEngine.loadTemplate(path.join(TEMPLATES, templateName));
  return TemplateEngine.buildFile({
    template,
    variables: { ...VARIABLES, ...extraVariables },
    namespaceStyle: 'block',
    braceStyle: 'allman',
    enableNullable: false,
    ...options
  });
}

describe('new templates (0.2.0)', () => {
  it('MVC controller inherits Controller with a default Index action', () => {
    const output = build('mvc-controller.cs.template');
    expect(output).toContain('using Microsoft.AspNetCore.Mvc;');
    expect(output).toContain('public class Foo : Controller');
    expect(output).toContain('public IActionResult Index()');
    expect(output.includes('${')).toBe(false);
  });

  it('API controller carries the attributes and full CRUD skeleton', () => {
    const output = build('api-controller.cs.template');
    expect(output).toContain('[ApiController]');
    expect(output).toContain('[Route("api/[controller]")]');
    expect(output).toContain('public class Foo : ControllerBase');
    expect(output.match(/\[HttpGet/g).length).toBe(2);
    expect(output).toContain('[HttpPost]');
    expect(output).toContain('[HttpPut("{id}")]');
    expect(output).toContain('[HttpDelete("{id}")]');
  });

  it('Razor page code-behind is a PageModel with OnGet', () => {
    const output = build('razor-page.cs.template');
    expect(output).toContain('using Microsoft.AspNetCore.Mvc.RazorPages;');
    expect(output).toContain('public class FooModel : PageModel');
    expect(output).toContain('public void OnGet()');
  });

  it('Razor page markup references the fully-qualified model', () => {
    const output = build('razor-page.cshtml.template');
    expect(output).toContain('@page');
    expect(output).toContain('@model App.Services.FooModel');
  });

  it('UWP page: x:Class and local namespace resolve, code-behind extends Page', () => {
    const markup = build('uwp-page.xaml.template');
    expect(markup).toContain('<Page');
    expect(markup).toContain('x:Class="App.Services.Foo"');
    expect(markup).toContain('xmlns:local="using:App.Services"');

    const codeBehind = build('uwp-view.xaml.cs.template', { basetype: 'Page' });
    expect(codeBehind).toContain('public sealed partial class Foo : Page');
    expect(codeBehind).toContain('this.InitializeComponent();');
  });

  it('UWP window and UserControl use their own root elements', () => {
    expect(build('uwp-window.xaml.template')).toContain('<Window');
    expect(build('uwp-view.xaml.cs.template', { basetype: 'Window' })).toContain(': Window');
    expect(build('uwp-usercontrol.xaml.template')).toContain('<UserControl');
    expect(build('uwp-view.xaml.cs.template', { basetype: 'UserControl' })).toContain(': UserControl');
  });

  it('UWP resource file is a well-formed empty resw', () => {
    const output = build('uwp-resource.resw.template');
    expect(output.startsWith('<?xml')).toBe(true);
    expect(output).toContain('<root>');
    expect(output).toContain('<resheader name="resmimetype">');
    expect(output).toContain('</root>');
    expect(output.includes('${')).toBe(false);
  });

  it('explicit test templates carry the right framework attributes', () => {
    const xunit = build('xunit-test.cs.template');
    expect(xunit).toContain('using Xunit;');
    expect(xunit).toContain('[Fact]');
    expect(xunit).toContain('Assert.True(true);');

    const nunit = build('nunit-test.cs.template');
    expect(nunit).toContain('using NUnit.Framework;');
    expect(nunit).toContain('[TestFixture]');
    expect(nunit).toContain('[Test]');

    const mstest = build('mstest-test.cs.template');
    expect(mstest).toContain('using Microsoft.VisualStudio.TestTools.UnitTesting;');
    expect(mstest).toContain('[TestClass]');
    expect(mstest).toContain('[TestMethod]');
  });

  it('supports file-scoped namespaces in the new C# templates too', () => {
    const output = build('razor-page.cs.template', {}, { namespaceStyle: 'file-scoped' });
    expect(output).toContain('namespace App.Services;');
    expect(output).not.toContain('namespace App.Services\n{');
  });

  it('adds #nullable to C# templates when requested', () => {
    expect(build('mvc-controller.cs.template', {}, { enableNullable: true }).startsWith('#nullable enable')).toBe(true);
  });
});
