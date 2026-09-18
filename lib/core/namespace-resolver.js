'use babel';

/**
 * NamespaceResolver — walks up the directory tree from a starting folder,
 * finds the nearest `.csproj` (or legacy `project.json`) and derives the
 * C# namespace from the project's root namespace plus the relative folder
 * path. If the starting folder is inside a workspace root and no project
 * file is found *within that root*, the namespace falls back to the root
 * folder name (multi-root safe).
 *
 * Pure Node.js (no Atom API) so it is trivially unit-testable.
 *
 * Author: Armin Daraei
 */

import path from 'path';
import fs from 'fs';

const ROOT_NAMESPACE_PATTERN = /<RootNamespace>\s*([^<]+?)\s*<\/RootNamespace>/;

export default class NamespaceResolver {
  static isProjectFile(fileName) {
    return fileName.endsWith('.csproj') || fileName === 'project.json';
  }

  static findProjectFiles(dir) {
    let entries = [];
    try {
      entries = fs.readdirSync(dir);
    } catch (error) {
      return [];
    }

    const files = [];
    for (const entry of entries) {
      const full = path.join(dir, entry);
      let stat = null;
      try {
        stat = fs.statSync(full);
      } catch (error) {
        continue;
      }
      if (stat.isFile() && this.isProjectFile(entry)) files.push(entry);
    }
    return files;
  }

  static getRootNamespace(projectFile, fallback) {
    if (projectFile && projectFile.toLowerCase().endsWith('.csproj')) {
      try {
        const content = fs.readFileSync(projectFile, 'utf8');
        const match = content.match(ROOT_NAMESPACE_PATTERN);
        if (match && match[1].trim().length > 0) return match[1].trim();
      } catch (error) {
        // fall through to the fallback
      }
      return fallback;
    }

    if (projectFile && path.basename(projectFile) === 'project.json') {
      // Legacy .NET Core (≤ 1.x): the folder containing project.json is
      // the assembly name.
      return path.basename(path.dirname(projectFile));
    }

    return fallback;
  }

  /**
   * Walks upward from `startDir` until a project file is found. When
   * `limitDir` is given (the containing workspace root) the search stops
   * there so we never pick up an unrelated project from outside the
   * workspace.
   */
  static findProjectInfo(startDir, limitDir = null) {
    let current = path.resolve(startDir);
    for (;;) {
      const found = this.findProjectFiles(current);
      if (found.length > 0) {
        const sorted = found.slice().sort();
        const chosenName = sorted[0];
        const chosenPath = path.join(current, chosenName);
        return {
          projectRoot: current,
          projectFile: chosenPath,
          projectFileName: chosenName,
          rootNamespace: this.getRootNamespace(
            chosenPath,
            path.basename(chosenName, path.extname(chosenName))
          ),
          ambiguous: sorted.length > 1,
          source: 'project'
        };
      }

      if (limitDir && path.resolve(current) === path.resolve(limitDir)) return null;
      const parent = path.dirname(current);
      if (parent === current) return null; // filesystem root reached
      current = parent;
    }
  }

  /** Turns a folder name into a valid namespace segment. */
  static sanitizeSegment(segment) {
    return segment.replace(/[^\p{L}\p{N}_]/gu, '_').replace(/^(\p{N})/u, '_$1');
  }

  /**
   * @param {string} startDir        the folder the new file will live in
   * @param {string[]} workspaceRoots atom.project.getPaths() (multi-root ok)
   * @returns {null | {namespace, projectRoot, projectFile, projectFileName,
   *                   rootNamespace, ambiguous, source, segments}}
   */
  static resolve(startDir, workspaceRoots = []) {
    const absoluteStart = path.resolve(startDir);
    const containingRoot =
      workspaceRoots
        .map((root) => path.resolve(root))
        .find((root) => absoluteStart === root || absoluteStart.startsWith(root + path.sep)) ||
      null;

    const info = this.findProjectInfo(absoluteStart, containingRoot);

    if (info) {
      const relative = path.relative(info.projectRoot, absoluteStart);
      const segments = relative
        .split(path.sep)
        .filter((segment) => segment.length > 0 && segment !== '.')
        .map((segment) => this.sanitizeSegment(segment));
      const namespace =
        segments.length > 0 ? `${info.rootNamespace}.${segments.join('.')}` : info.rootNamespace;
      return { ...info, segments, namespace };
    }

    if (containingRoot) {
      // No .csproj inside the workspace root — derive the namespace from
      // the root folder name itself.
      const relative = path.relative(containingRoot, absoluteStart);
      const segments = relative
        .split(path.sep)
        .filter((segment) => segment.length > 0 && segment !== '.')
        .map((segment) => this.sanitizeSegment(segment));
      const rootNamespace = path.basename(containingRoot);
      const namespace =
        segments.length > 0 ? `${rootNamespace}.${segments.join('.')}` : rootNamespace;
      return {
        projectRoot: containingRoot,
        projectFile: null,
        projectFileName: null,
        rootNamespace,
        ambiguous: false,
        source: 'workspace',
        segments,
        namespace
      };
    }

    return null; // standalone file, nothing to derive from
  }
}
