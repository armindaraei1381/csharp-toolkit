'use babel';

import path from 'path';
import fs from 'fs';
import os from 'os';

import NamespaceResolver from '../lib/core/namespace-resolver';

describe('NamespaceResolver', () => {
  const tempDirs = [];

  function makeTempProject(structure) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cse-spec-'));
    tempDirs.push(root);
    for (const [relativePath, content] of Object.entries(structure)) {
      const full = path.join(root, relativePath);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, content || '');
    }
    return root;
  }

  afterEach(() => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  describe('single-level project', () => {
    it('uses the assembly (csproj) name as the namespace', () => {
      const root = makeTempProject({
        'MyApp.csproj': '<Project Sdk="Microsoft.NET.Sdk"></Project>'
      });
      const result = NamespaceResolver.resolve(root, [root]);
      expect(result.namespace).toBe('MyApp');
      expect(result.source).toBe('project');
    });
  });

  describe('nested folders', () => {
    it('appends subfolder names to the namespace', () => {
      const root = makeTempProject({
        'MyApp.csproj': '<Project Sdk="Microsoft.NET.Sdk"></Project>',
        'Services/Billing/Marker.cs': ''
      });
      const dir = path.join(root, 'Services', 'Billing');
      const result = NamespaceResolver.resolve(dir, [root]);
      expect(result.namespace).toBe('MyApp.Services.Billing');
    });

    it('honours <RootNamespace> in the csproj', () => {
      const root = makeTempProject({
        'MyApp.csproj':
          '<Project><PropertyGroup><RootNamespace>Contoso.Core</RootNamespace></PropertyGroup></Project>',
        'Services/Marker.cs': ''
      });
      const result = NamespaceResolver.resolve(path.join(root, 'Services'), [root]);
      expect(result.namespace).toBe('Contoso.Core.Services');
    });

    it('sanitizes folder names into valid namespace segments', () => {
      const root = makeTempProject({
        'MyApp.csproj': '<Project Sdk="Microsoft.NET.Sdk"></Project>',
        'My Folder/2020 Stuff/Marker.cs': ''
      });
      const result = NamespaceResolver.resolve(path.join(root, 'My Folder', '2020 Stuff'), [root]);
      expect(result.namespace).toBe('MyApp.My_Folder._2020_Stuff');
    });
  });

  describe('missing csproj', () => {
    it('falls back to the workspace root name when the folder is inside the workspace', () => {
      const root = makeTempProject({ 'Src/Marker.cs': '' });
      const result = NamespaceResolver.resolve(path.join(root, 'Src'), [root]);
      expect(result.source).toBe('workspace');
      expect(result.namespace).toBe(`${path.basename(root)}.Src`);
    });

    it('returns null for a standalone folder outside any workspace root', () => {
      const projectRoot = makeTempProject({ 'App.csproj': '' });
      const isolated = makeTempProject({ 'Solo.cs': '' });
      const result = NamespaceResolver.resolve(isolated, [projectRoot]);
      expect(result).toBe(null);
    });

    it('never searches above the containing workspace root', () => {
      const outer = makeTempProject({
        'App.csproj': '',
        'sub/notes.txt': ''
      });
      const sub = path.join(outer, 'sub');
      const result = NamespaceResolver.resolve(sub, [sub]);
      expect(result.source).toBe('workspace');
      expect(result.namespace).toBe(path.basename(sub));
    });
  });

  describe('multiple sibling project files', () => {
    it('deterministically picks the alphabetically first project and flags ambiguity', () => {
      const root = makeTempProject({
        'Bb.csproj': '',
        'Aa.csproj': ''
      });
      const result = NamespaceResolver.resolve(root, [root]);
      expect(result.rootNamespace).toBe('Aa');
      expect(result.ambiguous).toBe(true);
    });
  });

  describe('legacy project.json', () => {
    it('uses the containing folder name as the root namespace', () => {
      const root = makeTempProject({ 'project.json': '{}' });
      const result = NamespaceResolver.resolve(root, [root]);
      expect(result.namespace).toBe(path.basename(root));
    });
  });
});
