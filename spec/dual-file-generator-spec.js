'use babel';

import path from 'path';
import fs from 'fs';
import os from 'os';

import DualFileGenerator from '../lib/core/dual-file-generator';

describe('DualFileGenerator', () => {
  const tempDirs = [];

  function makeTempDir() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cse-dual-'));
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    while (tempDirs.length > 0) {
      fs.rmSync(tempDirs.pop(), { recursive: true, force: true });
    }
  });

  /** Fixture: a markup-like primary file and a C#-like secondary file. */
  function makeSpecs(templateDir) {
    fs.writeFileSync(
      path.join(templateDir, 'primary.template'),
      'PRIMARY ${namespace} ${classname}\n'
    );
    fs.writeFileSync(
      path.join(templateDir, 'secondary.template'),
      'namespace ${namespace}\n{\n    class ${classname} {}\n}\n'
    );
    return [
      { suffix: '.view', templatePath: path.join(templateDir, 'primary.template'), primary: true },
      { suffix: '.logic.cs', templatePath: path.join(templateDir, 'secondary.template') }
    ];
  }

  const planOptionsFor = (dir) => ({
    baseName: 'Contact',
    targetDir: dir,
    namespace: 'App.Pages',
    fileSpecs: makeSpecs(dir)
  });

  it('plans both files with correct names and substituted variables', () => {
    const dir = makeTempDir();
    const plan = DualFileGenerator.plan(planOptionsFor(dir));

    expect(plan.length).toBe(2);
    expect(plan[0].fileName).toBe('Contact.view');
    expect(plan[1].fileName).toBe('Contact.logic.cs');
    expect(plan[0].content).toBe('PRIMARY App.Pages Contact\n');
    expect(plan[1].content).toContain('namespace App.Pages');
    expect(plan[1].content).toContain('class Contact');
    expect(plan[0].content.includes('${')).toBe(false);
    expect(plan[1].content.includes('${')).toBe(false);
    expect(plan[0].primary).toBe(true);
  });

  it('writes both files to disk with the rendered content', () => {
    const dir = makeTempDir();
    const plan = DualFileGenerator.plan(planOptionsFor(dir));

    const { written, collision } = DualFileGenerator.write(plan);

    expect(collision).toBe(null);
    expect(written.length).toBe(2);
    expect(fs.readFileSync(path.join(dir, 'Contact.view'), 'utf8')).toContain('App.Pages');
    expect(fs.readFileSync(path.join(dir, 'Contact.logic.cs'), 'utf8')).toContain('App.Pages');
  });

  it('writes nothing when either file name already exists', () => {
    const dir = makeTempDir();
    const plan = DualFileGenerator.plan(planOptionsFor(dir));
    fs.writeFileSync(path.join(dir, 'Contact.view'), 'OLD CONTENT');

    const { written, collision } = DualFileGenerator.write(plan);

    expect(collision).toBe(path.join(dir, 'Contact.view'));
    expect(written.length).toBe(0);
    expect(fs.existsSync(path.join(dir, 'Contact.logic.cs'))).toBe(false);
    expect(fs.readFileSync(path.join(dir, 'Contact.view'), 'utf8')).toBe('OLD CONTENT');
  });

  it('opens both files with the primary last (focus) and reveals it', async () => {
    const dir = makeTempDir();
    const opened = [];
    const revealed = [];

    await DualFileGenerator.generate({
      ...planOptionsFor(dir),
      opener: (filePath) => {
        opened.push(filePath);
      },
      reveal: (filePath) => revealed.push(filePath)
    });

    expect(opened.length).toBe(2);
    expect(opened[opened.length - 1]).toBe(path.join(dir, 'Contact.view'));
    expect(revealed).toEqual([path.join(dir, 'Contact.view')]);
  });

  it('does not open anything when a collision blocks the write', async () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'Contact.view'), 'OLD');
    const opened = [];

    const result = await DualFileGenerator.generate({
      ...planOptionsFor(dir),
      opener: (filePath) => {
        opened.push(filePath);
      }
    });

    expect(result.collision).toBe(path.join(dir, 'Contact.view'));
    expect(opened).toEqual([]);
  });

  it('applies #nullable only to the C# file of the pair', () => {
    const dir = makeTempDir();
    const plan = DualFileGenerator.plan({
      ...planOptionsFor(dir),
      enableNullable: true
    });

    expect(plan[1].content.startsWith('#nullable enable')).toBe(true); // .logic.cs
    expect(plan[0].content.includes('#nullable')).toBe(false);         // .view
  });
});
