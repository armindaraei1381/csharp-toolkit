'use babel';

import {
  parseDotnetNewList,
  FALLBACK_TEMPLATES,
  DotnetNotFoundError
} from '../lib/core/dotnet-templates';

const DOTNET_SAMPLE = [
  'These templates matched your input:',
  '',
  'Template Name                       Short Name          Language    Tags',
  '----------------------------------  ------------------  --------    -------------------------',
  'Avalonia ASP.NET Web Application    avalonia.aspnet     [C#]        UI/Xaml',
  'Blazor Web App                      blazor              [C#]        Web/Blazor',
  'Console App                         console             [C#],F#,VB  Common/Console',
  'Class Library                       classlib            [C#],F#,VB  Common/Library',
  'ASP.NET Core Web App (MVC)          mvc                 [C#]        Web/MVC',
  'xUnit Test Project                  xunit               [C#],F#,VB  Test/MSTest/xUnit',
  'Solution File                       sln                 -           Solution/Projects',
  'F# Console Application              console-fsharp      F#          Common/Console',
  ''
].join('\n');

describe('parseDotnetNewList', () => {
  it('parses template rows from a realistic `dotnet new list` output', () => {
    const templates = parseDotnetNewList(DOTNET_SAMPLE);
    expect(templates).not.toBe(null);
    expect(templates.length).toBe(7);

    const consoleApp = templates.find((t) => t.shortName === 'console');
    expect(consoleApp.name).toBe('Console App');

    const mvc = templates.find((t) => t.shortName === 'mvc');
    expect(mvc.name).toBe('ASP.NET Core Web App (MVC)'); // single spaces survive
    expect(mvc.tags).toBe('Web/MVC');

    const sln = templates.find((t) => t.shortName === 'sln');
    expect(sln.name).toBe('Solution File'); // no language marker → kept
  });

  it('excludes templates whose language cannot produce C# projects', () => {
    const templates = parseDotnetNewList(DOTNET_SAMPLE);
    expect(templates.some((t) => t.shortName === 'console-fsharp')).toBe(false);
  });

  it('returns null for unparsable output', () => {
    expect(parseDotnetNewList('')).toBe(null);
    expect(parseDotnetNewList('dotnet: command failed')).toBe(null);
    expect(parseDotnetNewList('Template Name Short Name\nno rule line')).toBe(null);
  });
});

describe('FALLBACK_TEMPLATES', () => {
  it('covers the common templates with the required shape', () => {
    const shortNames = FALLBACK_TEMPLATES.map((t) => t.shortName);
    for (const required of [
      'console', 'classlib', 'webapi', 'mvc', 'blazor',
      'maui', 'xunit', 'nunit', 'mstest', 'razorclasslib'
    ]) {
      expect(shortNames.includes(required)).toBe(true);
    }
    for (const template of FALLBACK_TEMPLATES) {
      expect(typeof template.name).toBe('string');
      expect(typeof template.shortName).toBe('string');
      expect(template.shortName.length).toBeGreaterThan(0);
      expect(typeof template.tags).toBe('string');
    }
  });
});

describe('DotnetNotFoundError', () => {
  it('carries a stable error code', () => {
    const error = new DotnetNotFoundError();
    expect(error.code).toBe('DOTNET_NOT_FOUND');
  });
});
