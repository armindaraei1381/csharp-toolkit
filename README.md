# CSharp Toolkit for Pulsar

**VersionLicense:** MIT

A complete C#/.NET toolkit for Pulsar: create whole .NET projects from the built-in templates, scaffold classes, interfaces, controllers, Razor pages, UWP views, test classes and ready-to-go constructors — all from the tree view or the command palette.

> **Note:** Formerly published as `csharpextensions-pulsar`. See the [migration note](#-migration-from-csharpextensions-pulsar) below.

---

## ✨ Features

### Create .NET Project

- **Command palette ▸ `CSharp Toolkit: Create .NET Project`** → a searchable template picker (Console, Class Library, ASP.NET Core Web API, MVC, Blazor, MAUI, xUnit/NUnit/MSTest, …) with short names and tag descriptions.
- Templates are read live from `dotnet new list`; if the CLI output cannot be parsed, a curated fallback list is shown — the picker always works.
- Enter the project name and destination folder (validated live), and the package runs `dotnet new <template> -n <name> -o <path>` with a progress notification and clear error reporting (including a *"install the .NET SDK"* helper when `dotnet` is missing).
- Optionally opens the new project in the same or a new Pulsar window (configurable; default: **ask**).

### File scaffolding

- New **C# Class / Interface / Enum / Struct / Record / Record Struct / Abstract Class / Static Class** with auto-resolved namespaces.
- **MVC Controller**, **API Controller** (CRUD skeleton), **Razor Page** (`Name.cshtml` + `Name.cshtml.cs`), **UWP Page / Window / UserControl** (`Name.xaml` + `Name.xaml.cs`), **UWP Resource File** (`.resw`).
- **xUnit / NUnit / MSTest** test classes, plus a generic **New Unit Test Class** command driven by the `testFramework` setting.
- **Constructor from Properties** (block or expression-bodied) with automatic missing-using detection (xUnit-style confirmation or silent).
- Smart tree-view context menu (*"New C#"*) that hides the ASP.NET/UWP groups in projects that don't need them.

### Quality-of-life

- C# 10 file-scoped namespaces, nullable header, Allman/K&R braces, interface prefix — all configurable.
- Full identifier validation (keywords, Unicode, verbatim `@`).
- Custom user templates in `~/.pulsar/csharpextensions-templates/`.
- Bilingual messages: **English / فارسی** (RTL-aware dialogs).

---

## 📦 Installation

```bash
ppm install csharp-toolkit
```

---

## 🚀 Usage

| Action | How |
| --- | --- |
| Create a whole .NET project | Command Palette ▸ `CSharp Toolkit: Create .NET Project` *(requires the .NET SDK on PATH)* |
| New class / interface / … | Right-click a folder in the tree view ▸ **New C#**, or the Command Palette |
| Constructor from properties | Cursor inside a class ▸ `Ctrl+Alt+Shift+C` |

---

## ⚙️ Settings

| Setting | Default |
| --- | --- |
| Namespace style (block / file-scoped) | `block` |
| Nullable reference types header | `off` |
| Interface prefix | `I` |
| Brace style | `allman` |
| Default constructor style | `regular` |
| Unit test framework | `xunit` |
| Confirm adding usings | `on` |
| Hide ASP.NET/UWP groups in non-matching projects | `on` |
| Open created .NET project (ask / current / new window) | `ask` |
| Message language | `en` |

---

## ⚠️ Migration from `csharpextensions-pulsar`

This package was **renamed** from `csharpextensions-pulsar` to `csharp-toolkit` in version `0.3.0`. There is no automatic migration between the two registry entries: please **uninstall the old package and install `csharp-toolkit`**.

Your settings are migrated automatically on first run (copied from the old `csharpextensions-pulsar.*` config scope into `csharp-toolkit.*`), and all command names now use the `csharp-toolkit:` prefix — update any personal keybindings that referenced the old prefix.

---

## 🛠 Development

```bash
git clone https://github.com/armindaraei1381/csharp-toolkit
cd csharp-toolkit
ppm install
ppm link
# Reload Pulsar, then: View ▸ Developer ▸ Run Package Specs
ppm test
```

---

## 👏 Credits

- **Author & maintainer:** Armin Daraei
- Inspired by — and developed in gratitude to — [`jchannon/csharpextensions`](https://github.com/jchannon/csharpextensions) by Justin Channon and the [`KreativJos/csharpextensions`](https://github.com/KreativJos/csharpextensions) fork for VS Code. This package is an independent, native re-implementation for Pulsar, **not** a port of their source code.

---

## 📄 License

**MIT** — this is a derivative work of an MIT-licensed project; the original license notice is preserved in `LICENSE.txt`.
