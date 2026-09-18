'use babel';

/**
 * ProjectKindDetector — inspects the nearest `.csproj` (found by the existing
 * NamespaceResolver, so multi-root boundaries are respected) and reports
 * whether the project is ASP.NET Core and/or UWP/WinUI.
 *
 * Returns results, or `null` when unknown (no project file or an unreadable
 * one) — callers treat `null` as "keep the menu group visible".
 * Results are cached per project file and invalidated by mtime.
 *
 * Author: Armin Daraei
 */

import fs from 'fs';

import NamespaceResolver from './namespace-resolver';

const ASPNET_CORE_PATTERN = /Microsoft\.AspNetCore/; // PackageReference or FrameworkReference

const UWP_PATTERN = new RegExp(
  [
    'Microsoft\\.NETCore\\.UniversalWindowsPlatform', // classic UWP projects
    'Microsoft\\.WindowsAppSDK',                      // WinUI 3
    'Microsoft\\.WinUI\\b',                           // WinUI 2/3 package refs
    'TargetPlatformIdentifier>\\s*UAP\\b',            // classic UWP project property
    'UseWinUI>\\s*true'                               // WinUI 3 property
  ].join('|'),
  'i'
);

const cache = new Map(); // projectFile → { mtimeMs, aspNet, uwp }

export default class ProjectKindDetector {
  /**
   * @returns {{aspNet: boolean, uwp: boolean} | null}
   */
  static detect(startDir, workspaceRoots = []) {
    const info = NamespaceResolver.resolve(startDir, workspaceRoots);
    if (!info || !info.projectFile || !info.projectFile.toLowerCase().endsWith('.csproj')) {
      return null;
    }

    const projectFile = info.projectFile;
    try {
      const stat = fs.statSync(projectFile);
      const cached = cache.get(projectFile);
      if (cached && cached.mtimeMs === stat.mtimeMs) return cached;

      const content = fs.readFileSync(projectFile, 'utf8');
      const result = {
        mtimeMs: stat.mtimeMs,
        aspNet: ASPNET_CORE_PATTERN.test(content),
        uwp: UWP_PATTERN.test(content)
      };
      cache.set(projectFile, result);
      return result;
    } catch (error) {
      return null;
    }
  }

  /** @returns {boolean | null} */
  static detectAspNet(startDir, workspaceRoots) {
    const result = this.detect(startDir, workspaceRoots);
    return result ? result.aspNet : null;
  }

  /** @returns {boolean | null} */
  static detectUwp(startDir, workspaceRoots) {
    const result = this.detect(startDir, workspaceRoots);
    return result ? result.uwp : null;
  }
}
