'use babel';

/**
 * DualFileGenerator — shared scaffolding logic for related file pairs such as
 * Razor Pages (`Foo.cshtml` + `Foo.cshtml.cs`) and UWP views
 * (`Foo.xaml` + `Foo.xaml.cs`).
 *
 * Rendering stays in TemplateEngine; this module orchestrates the pair:
 * plan → collision check → write → open (primary keeps focus) → reveal.
 *
 * Every side effect (`opener`, `reveal`) can be injected, which keeps the
 * module trivially unit-testable.
 *
 * Author: Armin Daraei
 */

import path from 'path';
import fs from 'fs';

import TemplateEngine from './template-engine';

export default class DualFileGenerator {
  /**
   * Renders every file spec into a concrete file plan (no side effects).
   * `#nullable enable` is only applied to C# files (suffix ending in `.cs`),
   * never to markup (.cshtml/.xaml) — so `.cshtml.cs` and `.xaml.cs` still
   * get it, but `.cshtml` and `.xaml` do not.
   */
  static plan({
    baseName,
    targetDir,
    namespace,
    fileSpecs,
    variables = {},
    namespaceStyle = 'block',
    braceStyle = 'allman',
    enableNullable = false
  }) {
    return fileSpecs.map((spec) => {
      const template = TemplateEngine.loadTemplate(spec.templatePath);
      const appliesToCSharp = /\.cs$/.test(spec.suffix);
      const content = TemplateEngine.buildFile({
        template,
        variables: { namespace, classname: baseName, ...variables, ...(spec.extraVariables || {}) },
        namespaceStyle,
        braceStyle,
        enableNullable: enableNullable && appliesToCSharp
      });
      const fileName = `${baseName}${spec.suffix}`;
      return {
        fileName,
        absolutePath: path.join(targetDir, fileName),
        content,
        primary: !!spec.primary
      };
    });
  }

  /** Returns the first planned file that already exists on disk, or null. */
  static findCollision(plan) {
    for (const file of plan) {
      if (fs.existsSync(file.absolutePath)) return file.absolutePath;
    }
    return null;
  }

  /**
   * Writes all planned files. The collision check runs again immediately
   * before writing (all-or-nothing per pair).
   */
  static write(plan) {
    const collision = this.findCollision(plan);
    if (collision) return { written: [], collision };
    for (const file of plan) {
      fs.writeFileSync(file.absolutePath, file.content, { encoding: 'utf8' });
    }
    return { written: plan, collision: null };
  }

  /**
   * Opens every written file in the workspace. The primary file (the markup
   * side) is opened last so it keeps the focus, then optionally revealed in
   * the tree view.
   */
  static async open(plan, opener = null, reveal = null) {
    const openFile = opener || ((filePath) => atom.workspace.open(filePath));
    const primary = plan.find((file) => file.primary) || plan[0];
    for (const file of plan) {
      if (file === primary) continue;
      await openFile(file.absolutePath);
    }
    await openFile(primary.absolutePath);
    if (typeof reveal === 'function') reveal(primary.absolutePath);
  }

  /** One-shot helper used by the commands: plan → write → open. */
  static async generate(options) {
    const { opener = null, reveal = null, ...planOptions } = options;
    const plan = this.plan(planOptions);
    const result = this.write(plan);
    if (result.collision) return result;
    await this.open(result.written, opener, reveal);
    return result;
  }
}
