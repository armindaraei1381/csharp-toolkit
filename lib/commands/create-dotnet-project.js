'use babel';

/**
 * CreateDotnetProjectCommand — scaffolds a whole .NET project via the
 * `dotnet` CLI, mirroring the "Create Project" flow of the VS Code C# Dev Kit:
 *
 *   pick template → enter name → enter destination folder →
 *   run `dotnet new <short> -n <name> -o <folder/name>` → open the result
 *
 * The destination defaults to the first workspace root (or the home
 * directory) and can be edited by hand — Pulsar has no native folder picker.
 *
 * Author: Armin Daraei
 */

import path from 'path';
import os from 'os';
import fs from 'fs';

import { listTemplates, runDotnet, DotnetNotFoundError } from '../core/dotnet-templates';
import SelectListModal from '../ui/select-list-modal';
import InputDialog from '../ui/input-dialog';
import i18n from '../core/i18n';
import { configKey } from '../core/package-meta';

const ILLEGAL_FOLDER_CHARS = /[\\/:*?"<>|]/;

export default class CreateDotnetProjectCommand {
  run() {
    this.execute().catch((error) => this.notifyError(error));
  }

  async execute() {
    let templates;
    try {
      templates = await listTemplates();
    } catch (error) {
      if (error instanceof DotnetNotFoundError || error.code === 'DOTNET_NOT_FOUND') {
        this.showDotnetMissingError();
        return;
      }
      throw error;
    }

    const picker = new SelectListModal({
      prompt: i18n.t('createProject.selectPrompt'),
      placeholderText: i18n.t('createProject.selectPlaceholder'),
      rtl: i18n.isRTL(),
      items: templates.map((template) => ({
        label: template.name,
        description: `${template.shortName}${template.tags ? ` — ${template.tags}` : ''}`,
        value: template.shortName
      })),
      onConfirm: (shortName) => this.promptProjectName(shortName)
    });
    picker.attach();
  }

  showDotnetMissingError() {
    atom.notifications.addError(i18n.t('createProject.errorDotnetMissing'), {
      dismissable: true,
      buttons: [
        {
          text: 'dotnet.microsoft.com/download',
          className: 'icon icon-link-external',
          onDidClick: () => {
            try {
              require('electron').shell.openExternal('https://dotnet.microsoft.com/download');
            } catch (error) {
              console.error('[csharp-toolkit] could not open external URL:', error);
            }
          }
        }
      ]
    });
  }

  promptProjectName(shortName) {
    const dialog = new InputDialog({
      prompt: i18n.t('createProject.namePrompt'),
      placeholderText: i18n.t('createProject.namePlaceholder'),
      rtl: i18n.isRTL(),
      validate: (value) => this.validateProjectName(value),
      hint: (value) =>
        i18n.t('dialog.fileHint', {
          file: path.join(this.defaultDestination(), this.trimmed(value))
        }),
      onConfirm: (value) => this.promptDestination(shortName, this.trimmed(value))
    });
    dialog.attach();
  }

  promptDestination(shortName, projectName) {
    const dialog = new InputDialog({
      prompt: i18n.t('createProject.pathPrompt'),
      initialValue: this.defaultDestination(),
      placeholderText: i18n.t('createProject.pathPlaceholder'),
      rtl: i18n.isRTL(),
      validate: (value) => this.validateDestination(value),
      hint: (value) =>
        i18n.t('dialog.fileHint', { file: path.join(this.trimmed(value), projectName) }),
      onConfirm: (value) => this.create(shortName, projectName, this.trimmed(value))
    });
    dialog.attach();
  }

  trimmed(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  defaultDestination() {
    const roots = atom.project.getPaths();
    if (roots && roots.length > 0) return roots[0];
    return os.homedir();
  }

  validateProjectName(rawName) {
    const name = this.trimmed(rawName);
    if (name.length === 0) {
      return { valid: false, message: i18n.t('validator.empty') };
    }
    if (ILLEGAL_FOLDER_CHARS.test(name)) {
      return { valid: false, message: i18n.t('createProject.error.invalidName') };
    }
    const target = path.join(this.defaultDestination(), name);
    if (fs.existsSync(target)) {
      return {
        valid: false,
        message: i18n.t('createProject.error.targetExists', { path: target })
      };
    }
    return { valid: true };
  }

  validateDestination(rawPath) {
    const folder = this.trimmed(rawPath);
    if (folder.length === 0) {
      return { valid: false, message: i18n.t('validator.empty') };
    }
    let stat = null;
    try {
      stat = fs.statSync(folder);
    } catch (error) {
      stat = null;
    }
    if (!stat || !stat.isDirectory()) {
      return {
        valid: false,
        message: i18n.t('createProject.error.invalidDir', { path: folder })
      };
    }
    return { valid: true };
  }

  async create(shortName, projectName, destination) {
    const targetDir = path.join(destination, projectName);

    const progress = atom.notifications.addInfo(
      i18n.t('createProject.creating', { name: projectName, short: shortName }),
      { dismissable: false }
    );

    try {
      const { code, stderr, notFound } = await runDotnet([
        'new', shortName, '-n', projectName, '-o', targetDir
      ]);
      progress.dismiss();

      if (notFound) {
        this.showDotnetMissingError();
        return;
      }
      if (code !== 0) {
        const detail = (stderr || '').trim().split('\n').slice(-6).join('\n');
        atom.notifications.addError(
          i18n.t('createProject.failed', { code: String(code) }) + (detail ? `\n${detail}` : ''),
          { dismissable: true }
        );
        return;
      }

      atom.notifications.addSuccess(
        i18n.t('createProject.success', { name: projectName, path: targetDir }),
        { dismissable: true }
      );
      this.offerOpen(targetDir);
    } catch (error) {
      progress.dismiss();
      this.notifyError(error);
    }
  }

  offerOpen(targetDir) {
    const mode = atom.config.get(configKey('openCreatedProjectIn')) || 'ask';

    const openHere = () => atom.open({ pathsToOpen: [targetDir], newWindow: false });
    const openNewWindow = () => atom.open({ pathsToOpen: [targetDir], newWindow: true });

    if (mode === 'current-window') {
      openHere();
      return;
    }
    if (mode === 'new-window') {
      openNewWindow();
      return;
    }

    const notification = atom.notifications.addInfo(
      i18n.t('createProject.openQuestion', { name: path.basename(targetDir) }),
      {
        dismissable: true,
        buttons: [
          {
            text: i18n.t('createProject.openHere'),
            className: 'icon icon-home',
            onDidClick: () => {
              notification.dismiss();
              openHere();
            }
          },
          {
            text: i18n.t('createProject.openNewWindow'),
            className: 'icon icon-link-external',
            onDidClick: () => {
              notification.dismiss();
              openNewWindow();
            }
          }
        ]
      }
    );
  }

  notifyError(error) {
    console.error('[csharp-toolkit]', error);
    atom.notifications.addError(
      i18n.t('error.unexpected', { message: error && error.message ? error.message : String(error) }),
      { stack: error && error.stack ? error.stack : undefined, dismissable: true }
    );
  }
}
