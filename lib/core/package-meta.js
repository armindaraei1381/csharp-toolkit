'use babel';

/**
 * Package identity — the single source of truth for the package name used
 * in command prefixes, config keys and legacy settings migration.
 *
 * Author: Armin Daraei
 */

export const PACKAGE_NAME = 'csharp-toolkit';
export const LEGACY_PACKAGE_NAME = 'csharpextensions-pulsar';

/** `new-class` → `csharp-toolkit:new-class` */
export function commandName(name) {
  return `${PACKAGE_NAME}:${name}`;
}

/** `language` → `csharp-toolkit.language` */
export function configKey(key) {
  return `${PACKAGE_NAME}.${key}`;
}
