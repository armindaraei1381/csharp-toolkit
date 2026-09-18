'use babel';

/**
 * csharpextensions-pulsar — main entry point.
 *
 * A native Pulsar (Atom API) port of the famous `csharpextensions`
 * extension for VS Code, plus extra modern C# features.
 *
 * Author: Armin Daraei
 */

import { CompositeDisposable } from 'atom';
import path from 'path';
import fs from 'fs';

import NewFileCommand from './commands/new-file-command';
import DualFileCommand from './commands/dual-file-command';
import ConstructorFromPropertiesCommand from './commands/constructor-from-properties';
import CustomTemplateCommand from './commands/custom-template-command';
import ProjectKindDetector from './core/project-kind-detector';
import i18n from './core/i18n';

const NEW_FILE_COMMANDS = [
  ['new-class', 'class'],
  ['new-interface', 'interface'],
  ['new-enum', 'enum'],
  ['new-struct', 'struct'],
  ['new-abstract-class', 'abstract-class'],
  ['new-static-class', 'static-class'],
  ['new-record', 'record'],
  ['new-record-struct', 'record-struct'],
  ['new-unit-test', 'unit-test'],
  // ── 0.2.0 ──
  ['new-mvc-controller', 'mvc-controller'],
  ['new-api-controller', 'api-controller'],
  ['new-xunit-test', 'xunit-test'],
  ['new-nunit-test', 'nunit-test'],
  ['new-mstest-test', 'mstest-test'],
  [
    'new-uwp-resource',
    'uwp-resource',
    {
      fileExtension: 'resw',
      templatePath: path.join(__dirname, '..', 'templates', 'uwp-resource.resw.template')
    }
  ]
];

const DUAL_FILE_COMMANDS = ['razor-page', 'uwp-page', 'uwp-window', 'uwp-usercontrol'];

export default {
  subscriptions: null,
  customTemplateSubscriptions: null,
  menuSubscriptions: null,
  treeViewService: null,

  activate() {
    this.subscriptions = new CompositeDisposable();
    this.customTemplateSubscriptions = new CompositeDisposable();
    this.menuSubscriptions = new CompositeDisposable();

    // --- New file scaffolding commands (single-file) ---
    for (const [name, kind, options = {}] of NEW_FILE_COMMANDS) {
      const command = new NewFileCommand(kind, {
        getTargetPath: (event) => this.getTargetPath(event),
        ...options
      });
      this.subscriptions.add(
        atom.commands.add('atom-workspace', `csharpextensions:${name}`, (event) => command.run(event))
      );
    }

    // --- New file scaffolding commands (dual-file: Razor / UWP) ---
    for (const kind of DUAL_FILE_COMMANDS) {
      const command = new DualFileCommand(kind, {
        getTargetPath: (event) => this.getTargetPath(event),
        reveal: (targetPath) => this.revealInTreeView(targetPath)
      });
      this.subscriptions.add(
        atom.commands.add('atom-workspace', `csharpextensions:new-${kind}`, (event) => command.run(event))
      );
    }

    // --- Constructor generation commands ---
    const constructorCommand = new ConstructorFromPropertiesCommand({
      expressionBodied: () =>
        atom.config.get('csharpextensions-pulsar.constructorStyle') === 'expression-bodied'
    });
    const expressionConstructorCommand = new ConstructorFromPropertiesCommand({
      expressionBodied: true
    });

    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'csharpextensions:constructor-from-properties': (event) => constructorCommand.run(event),
        'csharpextensions:constructor-from-properties-expression-body': (event) =>
          expressionConstructorCommand.run(event),
        'csharpextensions:reload-custom-templates': () => this.loadCustomTemplates(true)
      })
    );

    this.registerTreeViewContextMenu();
    this.loadCustomTemplates(false);
  },

  consumeTreeView(service) {
    this.treeViewService = service;
  },

  deactivate() {
    if (this.menuSubscriptions) this.menuSubscriptions.dispose();
    if (this.customTemplateSubscriptions) this.customTemplateSubscriptions.dispose();
    if (this.subscriptions) this.subscriptions.dispose();
    this.treeViewService = null;
  },

  serialize() {
    return {};
  },

  /**
   * Resolves the target path of an invocation with the following priority:
   * 1) The tree-view entry the user right-clicked (context menu event).
   * 2) The current tree-view selection (via the official tree-view service).
   * 3) The active text editor's file.
   * 4) The first project root of the workspace.
   */
  getPathFromEvent(event) {
    if (!event || !event.target || typeof event.target.closest !== 'function') return null;
    const entry = event.target.closest('.tree-view .entry');
    if (!entry) return null;
    return entry.getAttribute('data-path');
  },

  getTargetPath(event) {
    const fromEvent = this.getPathFromEvent(event);
    if (fromEvent) return fromEvent;

    if (this.treeViewService && typeof this.treeViewService.selectedPaths === 'function') {
      try {
        const selected = this.treeViewService.selectedPaths();
        if (selected && selected.length > 0) return selected[0];
      } catch (error) {
        // tree-view service not ready — fall through
      }
    }

    const editor = atom.workspace.getActiveTextEditor();
    if (editor && editor.getPath()) return editor.getPath();

    const projectPaths = atom.project.getPaths();
    return projectPaths && projectPaths.length > 0 ? projectPaths[0] : null;
  },

  /**
   * Grouped "New C#" context menu for the tree view — exact structure and
   * order of the spec. Registered from JS (not menus/*.json) because
   * conditional item visibility (`shouldDisplay`) — required by the
   * ASP.NET / UWP auto-hide settings — only exists in the context-menu API;
   * static JSON cannot express it.
   */
  registerTreeViewContextMenu() {
    const aspNetVisible = (event) => this.shouldShowContextGroup(event, 'aspnet');
    const uwpVisible = (event) => this.shouldShowContextGroup(event, 'uwp');
    const commandItem = (label, name, shouldDisplay = null) => {
      const item = { label, command: `csharpextensions:${name}` };
      if (shouldDisplay) item.shouldDisplay = (event) => shouldDisplay(event);
      return item;
    };

    const buildSubmenu = () => [
      commandItem('Class', 'new-class'),
      commandItem('Interface', 'new-interface'),
      commandItem('Enum', 'new-enum'),
      commandItem('Struct', 'new-struct'),
      { type: 'separator', shouldDisplay: aspNetVisible },
      commandItem('Controller', 'new-mvc-controller', aspNetVisible),
      commandItem('Api Controller', 'new-api-controller', aspNetVisible),
      commandItem('Razor Page', 'new-razor-page', aspNetVisible),
      { type: 'separator', shouldDisplay: uwpVisible },
      commandItem('UWP Page', 'new-uwp-page', uwpVisible),
      commandItem('UWP Window', 'new-uwp-window', uwpVisible),
      commandItem('UWP UserControl', 'new-uwp-usercontrol', uwpVisible),
      commandItem('UWP Resource File', 'new-uwp-resource', uwpVisible),
      { type: 'separator' },
      commandItem('XUnit Test', 'new-xunit-test'),
      commandItem('NUnit Test', 'new-nunit-test'),
      commandItem('MSTest', 'new-mstest-test')
    ];

    this.menuSubscriptions.add(
      atom.contextMenu.add({
        '.tree-view .directory': [{ label: 'New C#', submenu: buildSubmenu() }],
        '.tree-view .file': [{ label: 'New C#', submenu: buildSubmenu() }]
      })
    );
  },

  contextMenuDirectory(event) {
    if (!event || !event.target || typeof event.target.closest !== 'function') return null;
    const entry = event.target.closest('.tree-view .entry');
    if (!entry) return null;
    const targetPath = entry.getAttribute('data-path');
    if (!targetPath) return null;
    try {
      return fs.statSync(targetPath).isDirectory() ? targetPath : path.dirname(targetPath);
    } catch (error) {
      return targetPath;
    }
  },

  /**
   * Group visibility: if the smart-hide setting is off, always show. If on,
   * hide only on a definite "false" from the detector — unknown projects
   * (no .csproj) keep their groups.
   */
  shouldShowContextGroup(event, kind) {
    const setting =
      kind === 'aspnet' ? 'hideAspNetGroupWhenNotNeeded' : 'hideUwpGroupWhenNotNeeded';
    if (!atom.config.get(`csharpextensions-pulsar.${setting}`)) return true;
    const directory = this.contextMenuDirectory(event);
    if (!directory) return true;
    const workspaceRoots = atom.project.getPaths() || [];
    const detection =
      kind === 'aspnet'
        ? ProjectKindDetector.detectAspNet(directory, workspaceRoots)
        : ProjectKindDetector.detectUwp(directory, workspaceRoots);
    return detection !== false;
  },

  /** Best-effort reveal of a freshly created file in the tree view. */
  revealInTreeView(targetPath) {
    try {
      const service = this.treeViewService;
      if (service && typeof service.reveal === 'function') service.reveal(targetPath, false);
    } catch (error) {
      // The tree view refreshes itself via its file watchers anyway.
    }
  },

  customTemplatesDirectory() {
    return path.join(atom.getConfigDirPath(), 'csharpextensions-templates');
  },

  /**
   * Scans `~/.pulsar/csharpextensions-templates/*.template`, registers one
   * command + menu entry per user template. Files starting with `.` or `_`
   * are ignored (useful for documentation samples).
   */
  loadCustomTemplates(announce) {
    if (this.customTemplateSubscriptions) this.customTemplateSubscriptions.dispose();
    this.customTemplateSubscriptions = new CompositeDisposable();

    const directory = this.customTemplatesDirectory();
    try {
      fs.mkdirSync(directory, { recursive: true });
    } catch (error) {
      // The directory is optional — keep going.
    }

    let entries = [];
    try {
      entries = fs.readdirSync(directory);
    } catch (error) {
      entries = [];
    }

    const menuItems = [];
    for (const entry of entries.sort()) {
      if (entry.startsWith('.') || entry.startsWith('_')) continue;
      if (!entry.endsWith('.cs.template') && !entry.endsWith('.template')) continue;

      const id = entry.replace(/\.cs\.template$|\.template$/, '');
      const slug =
        id.toLowerCase().replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '') || 'template';
      const commandName = `csharpextensions:custom-${slug}`;
      const command = new CustomTemplateCommand(
        { id, templatePath: path.join(directory, entry) },
        { getTargetPath: (event) => this.getTargetPath(event) }
      );

      this.customTemplateSubscriptions.add(
        atom.commands.add('atom-workspace', commandName, (event) => command.run(event))
      );
      menuItems.push({ label: id, command: commandName });
    }

    if (menuItems.length > 0) {
      const menuLabel = i18n.t('menu.customTemplates');
      const mainMenu = atom.menu.add([
        {
          label: 'Packages',
          submenu: [{ label: 'C# Extensions', submenu: [{ label: menuLabel, submenu: menuItems }] }]
        }
      ]);
      if (mainMenu && typeof mainMenu.dispose === 'function') {
        this.customTemplateSubscriptions.add(mainMenu);
      }

      const contextMenu = atom.contextMenu.add({
        '.tree-view .directory': [{ label: menuLabel, submenu: menuItems.slice() }],
        '.tree-view .file': [{ label: menuLabel, submenu: menuItems.slice() }]
      });
      if (contextMenu && typeof contextMenu.dispose === 'function') {
        this.customTemplateSubscriptions.add(contextMenu);
      }
    }

    if (announce && menuItems.length > 0) {
      atom.notifications.addSuccess(
        i18n.t('info.customTemplatesLoaded', { count: String(menuItems.length) })
      );
    }
  }
};
