'use babel';

/**
 * DotnetTemplates — discovers .NET project templates by invoking the
 * `dotnet` CLI and parsing the tabular output of `dotnet new list`.
 * If the CLI is missing, or its output cannot be parsed, a curated fallback
 * list of the most common templates is returned so the user always sees a
 * usable picker.
 *
 * Author: Armin Daraei
 */

import { spawn } from 'child_process';

export class DotnetNotFoundError extends Error {
  constructor() {
    super('The `dotnet` CLI was not found on the PATH.');
    this.name = 'DotnetNotFoundError';
    this.code = 'DOTNET_NOT_FOUND';
  }
}

export const FALLBACK_TEMPLATES = [
  { name: '.NET MAUI App', shortName: 'maui', tags: 'Mobile, Desktop' },
  { name: '.NET MAUI Blazor Hybrid App', shortName: 'maui-blazor', tags: 'Mobile, Desktop, Blazor' },
  { name: '.NET MAUI Class Library', shortName: 'mauilib', tags: 'Mobile, Desktop, Library' },
  { name: 'ASP.NET Core Empty', shortName: 'web', tags: 'Web, Empty' },
  { name: 'ASP.NET Core gRPC Service', shortName: 'grpc', tags: 'Web, GRPC' },
  { name: 'ASP.NET Core Web API', shortName: 'webapi', tags: 'Web, WebAPI' },
  { name: 'ASP.NET Core Web API (Native AOT)', shortName: 'webapiaot', tags: 'Web, WebAPI, Native AOT' },
  { name: 'ASP.NET Core Web App', shortName: 'webapp', tags: 'Web, MVC, Razor' },
  { name: 'ASP.NET Core Web App (MVC)', shortName: 'mvc', tags: 'Web, MVC' },
  { name: 'Blazor Web App', shortName: 'blazor', tags: 'Web, Blazor' },
  { name: 'Blazor WebAssembly Standalone App', shortName: 'webassembly', tags: 'Web, Blazor, WebAssembly' },
  { name: 'Class Library', shortName: 'classlib', tags: 'Common, Library' },
  { name: 'Console App', shortName: 'console', tags: 'Common, Console' },
  { name: 'MSTest Test Project', shortName: 'mstest', tags: 'Test, MSTest' },
  { name: 'NUnit 3 Test Project', shortName: 'nunit', tags: 'Test, NUnit' },
  { name: 'Razor Class Library', shortName: 'razorclasslib', tags: 'Web, Razor, Library' },
  { name: 'xUnit Test Project', shortName: 'xunit', tags: 'Test, xUnit' }
];

/**
 * Runs the dotnet CLI and resolves { code, stdout, stderr, notFound }.
 * Never rejects — spawn errors are folded into the result.
 */
export function runDotnet(args) {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let child;
    try {
      child = spawn('dotnet', args, { windowsHide: true });
    } catch (error) {
      resolve({ code: -1, stdout, stderr: String(error && error.message), notFound: true });
      return;
    }
    child.on('error', (error) => {
      resolve({
        code: -1,
        stdout,
        stderr: String(error && error.message),
        notFound: !!(error && error.code === 'ENOENT')
      });
    });
    if (child.stdout) child.stdout.on('data', (chunk) => { stdout += chunk; });
    if (child.stderr) child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (code) => resolve({ code, stdout, stderr, notFound: false }));
  });
}

/**
 * Parses the tabular output of `dotnet new list` (columns are separated by
 * runs of 2+ spaces; the Language column carries `[C#]`/`F#`/`VB` markers).
 * Returns [{name, shortName, tags}] or `null` when the shape is unexpected.
 */
export function parseDotnetNewList(output) {
  if (typeof output !== 'string' || output.trim().length === 0) return null;

  const lines = output.split(/\r?\n/);
  const headerIndex = lines.findIndex(
    (line) => /Template Name/i.test(line) && /Short Name/i.test(line)
  );
  if (headerIndex === -1) return null;

  let ruleIndex = -1;
  for (let i = headerIndex + 1; i < Math.min(headerIndex + 5, lines.length); i++) {
    if (/^\s*-{3,}/.test(lines[i])) {
      ruleIndex = i;
      break;
    }
  }
  if (ruleIndex === -1) return null;

  const templates = [];
  for (let i = ruleIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().length === 0) {
      if (templates.length > 0) break; // end of table
      continue;
    }
    const columns = line.trim().split(/\s{2,}/);
    if (columns.length < 2) continue;

    const name = columns[0].trim();
    const shortNames = columns[1].split(',').map((s) => s.trim()).filter(Boolean);
    const language = (columns[2] || '').trim();
    const tags = columns.slice(3).join(' ').trim();

    if (!name || shortNames.length === 0) continue;
    // Keep rows with no language marker (e.g. `sln`, `-`) or a C# marker;
    // skip F#/VB-only templates.
    if (language && !/^[—-]$/.test(language) && !/C#/i.test(language)) continue;

    templates.push({ name, shortName: shortNames[0], tags });
  }
  return templates.length > 0 ? templates : null;
}

/**
 * Live template discovery with graceful degradation:
 * CLI missing → DotnetNotFoundError; unparsable/empty output → fallback.
 */
export async function listTemplates() {
  const { code, stdout, notFound } = await runDotnet(['new', 'list']);
  if (notFound) throw new DotnetNotFoundError();
  const parsed = code === 0 ? parseDotnetNewList(stdout) : null;
  return parsed && parsed.length > 0 ? parsed : FALLBACK_TEMPLATES.slice();
}
