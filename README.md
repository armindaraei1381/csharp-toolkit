# C# Extensions for Pulsar

**Version License:** MIT

Create C# classes, interfaces, enums, structs, records, static/abstract classes, unit-test classes and ready-to-go constructors straight from the tree view or the command palette — right inside Pulsar.

This package is a full, native Pulsar port of the popular `csharpextensions` extension for VS Code (and its KreativJos fork), rebuilt on top of the Atom/Pulsar APIs (`atom.commands`, `atom.workspace`, the tree-view service, Pulsar menus & keymaps) — plus a set of modern C# extras.


---

## ✨ Features

### Core (parity with the VS Code extension)

- Add C# Class / Interface / Enum / Struct from the tree-view context menu or the command palette, with an auto-resolved namespace.
- **Constructor from Properties** — generates a constructor that assigns every selected property.
- **Expression-bodied Constructor from Properties** (`=>`) for modern C#.
- Namespace resolution walks up to the nearest `.csproj` (or legacy `project.json`), honours `<RootNamespace>` and appends the relative folder path (`MyApp/Services` → `MyApp.Services`).
- Editable templates with `${namespace}` / `${classname}` placeholders.
- Right-click a folder (or a `.cs` file) in the tree view → **C# Extensions**.

### Extras beyond the original

- 🆕 **File-scoped namespaces** (`namespace X;` — C# 10+) via settings.
- 🆕 **Nullable reference types** (`#nullable enable` header) via settings.
- 🆕 **More templates:** Abstract Class, Static Class, Record, Record Struct, Unit Test Class (xUnit / MSTest / NUnit — selectable).
- 🆕 **Using-Directive Auto-Suggest:** missing usings for property types (`List<T>`, `HttpClient`, `ILogger`, …) are detected and added (with your confirmation, or silently — your choice).
- 🆕 **Full identifier validation:** legal characters, no leading digits, reserved & contextual keyword detection, verbatim `@` support, Unicode names.
- 🆕 **Multi-root workspace support.**
- 🆕 **Custom user templates:** drop `*.cs.template` files into `~/.pulsar/csharpextensions-templates/` and they appear in the menus (**Packages ▸ C# Extensions ▸ Custom templates**). Available variables: `${namespace}`, `${classname}`, `${year}`, `${date}`.
- 🆕 **Bilingual messages:** English / فارسی (with RTL dialogs), switchable in **Settings**.
- 🎨 Fully theme-aware UI using Pulsar's standard style variables and Octicon icon classes.

> ℹ️ The tree-view context-menu items appear after the package has been activated once (e.g. by running any command from the palette) — this is how Pulsar's lazy `activationCommands` work.

---

## 📦 Installation

```bash
ppm install csharpextensions-pulsar
```

or via Pulsar: **Settings ▸ Install ▸ csharpextensions-pulsar**.

---

## 🚀 Usage

| Action | How |
| --- | --- |
| New class / interface / enum / struct / … | Right-click a folder in the tree view ▸ **C# Extensions**, or Command Palette ▸ **C# Extensions: New …** |
| Constructor from properties | Place the cursor inside a class, then palette ▸ `csharpextensions:constructor-from-properties` |
| Expression-bodied constructor | `csharpextensions:constructor-from-properties-expression-body` |

### Default keybindings

| Keys | Command |
| --- | --- |
| `ctrl-alt-n` | New C# Class |
| `ctrl-alt-shift-c` | Constructor from Properties |
| `ctrl-alt-shift-e` | Expression-bodied Constructor from Properties |

---

## ⚙️ Settings

| Setting | Options | Default |
| --- | --- | --- |
| Namespace style | `block` / `file-scoped` | `block` |
| Nullable reference types | `on` / `off` | `off` |
| Interface prefix | any string (empty = disabled) | `I` |
| Brace style | `allman` / `k&r` | `allman` |
| Default constructor style | `regular` / `expression-bodied` | `regular` |
| Unit test framework | `xunit` / `mstest` / `nunit` | `xunit` |
| Confirm adding usings | `on` / `off` | `on` |
| Message language | `en` / `fa` | `en` |


---

## 👏 Credits

- **Author & maintainer:** Armin Daraei
- Inspired by — and developed in gratitude to — [jchannon/csharpextensions](https://github.com/jchannon/csharpextensions) by Justin Channon and the [KreativJos/csharpextensions](https://github.com/KreativJos/csharpextensions) fork.
- This package is an independent, native re-implementation for Pulsar, not a port of their source code.

---

## 📄 License

MIT — this is a derivative work of an MIT-licensed project; the original license notice is preserved in `LICENSE.txt`.
