# 📝 Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/).

---

## [0.3.0] — Renamed + Create .NET Project

> ⚠️ **Migration note:** the package was renamed from `csharpextensions-pulsar` to `csharp-toolkit`. There is no automatic migration between registry entries — uninstall the old package and install `csharp-toolkit`. Your settings are copied automatically from the old config scope on first run, and all command names now use the `csharp-toolkit:` prefix (update personal keybindings that used the old `csharpextensions:` prefix).

### 🔄 Changed (rename)

- Renamed the package from `csharpextensions-pulsar` to `csharp-toolkit` (manifest name, folder name, GitHub repository, registry entry).
- All commands re-registered under the `csharp-toolkit:` prefix; menus and keymaps updated accordingly (`menus/csharp-toolkit.json`, `keymaps/csharp-toolkit.json`, `styles/csharp-toolkit.less`).
- One-time, non-destructive migration of user settings from the `csharpextensions-pulsar.*` config scope to `csharp-toolkit.*`.

### ➕ Added (Create .NET Project)

- New command `csharp-toolkit:create-dotnet-project` (Command Palette + Packages menu):
  - Searchable template picker with live discovery via `dotnet new list` (parsed) and a **16-entry curated fallback list**.
  - Name and destination dialogs with live validation.
  - Progress notification during `dotnet new <template> -n <name> -o <path>`.
  - Explicit error reporting with a .NET SDK install hint when the CLI is missing.
  - Configurable same-window / new-window opening of the result.
- New modules:
  - `core/dotnet-templates.js` — CLI invocation, table parser, fallback list.
  - `commands/create-dotnet-project.js`.
  - `ui/select-list-modal.js` — filtered, keyboard-navigable QuickPick-style modal.
- New setting `openCreatedProjectIn` (`ask` / `current-window` / `new-window`).
- Jasmine specs for the template parser and the fallback list.

---

## [0.2.0] — Added

- **MVC Controller**, **API Controller** (CRUD skeleton), **Razor Page** (`Name.cshtml` + `Name.cshtml.cs`), **UWP Page / Window / UserControl** (`Name.xaml` + `Name.xaml.cs`), **UWP Resource File** (`.resw`), and explicit **xUnit / NUnit / MSTest** test class commands and templates.
- Grouped *"New C#"* tree-view context menu with separators and smart group visibility (`hideAspNetGroupWhenNotNeeded`, `hideUwpGroupWhenNotNeeded`) based on `.csproj` detection.
- `dual-file-generator.js` (shared multi-file scaffolding) and `project-kind-detector.js` (csproj-based, mtime-cached).
- `#nullable enable` applied only to C# files, never to markup.

---

## [0.1.2] — Fixed

- Fixed Less compilation error by replacing the non-standard `@panel-background-color` / `@panel-border-color` with the documented `@overlay-background-color` / `@overlay-border-color`.

---

## [0.1.1] — Fixed

- Fixed a startup crash caused by the non-standard `keymaps/menus` manifest keys (Pulsar auto-discovers those directories); normalized the context-menu JSON shape.

---

## [0.1.0] — Initial release

- New **C# Class / Interface / Enum / Struct** commands with automatic `.csproj`-based namespace resolution.
- **Constructor from Properties** (block and expression-bodied) with using-directive auto-suggest.
- Block/file-scoped namespaces, nullable header, Allman/K&R braces, interface prefix, test framework selection, identifier validation, multi-root support, custom user templates, bilingual messages, lazy activation.
