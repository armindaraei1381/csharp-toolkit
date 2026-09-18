## 0.1.0 - First Release
* Every feature added
* Every bug fixed
Changelog
All notable changes to this project are documented in this file.The format is based on Keep a Changelog.

[0.1.0] — Initial release
Core (feature parity with the VS Code csharpextensions extension)
Added New C# Class / Interface / Enum / Struct commands, available fromthe tree-view context menu (folder and .cs file) and the Command Palette.
Added Constructor from Properties and Expression-bodied Constructorfrom Properties.
Added automatic namespace resolution: nearest .csproj / legacyproject.json lookup, <RootNamespace> support, namespace built from therelative folder path.
Added editable built-in templates (templates/*.cs.template) with${namespace} / ${classname} placeholders.
Extras
File-scoped namespace output (C# 10+) — configurable.
Optional #nullable enable header — configurable.
Additional templates: Abstract Class, Static Class, Record, Record Struct,Unit Test Class with xUnit / MSTest / NUnit support — configurable.
Using-Directive Auto-Suggest for constructor generation (with optionalconfirmation step).
C# identifier validation (characters, leading digits, reserved andcontextual keywords, verbatim @ identifiers, Unicode names) with clear,localized error messages.
Multi-root workspace support with workspace-bound project search.
Custom user templates in ~/.pulsar/csharpextensions-templates/ withdynamic commands and menu entries + a reload command.
Bilingual (English / Persian) notifications with RTL-aware dialogs.
Theme-integrated modal UIs (input dialog, constructor picker) built onPulsar's standard style variables and Octicon classes.
Lazy activation via activationCommands; official tree-view serviceconsumption.
Jasmine unit tests for namespace-resolver, template-engine andcsharp-validator.
