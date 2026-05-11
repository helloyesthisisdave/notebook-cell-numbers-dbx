import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

// --- Language extension resolution ---

const langExtCache = new Map<string, string>();

function extensionForLanguage(languageId: string): string {
  if (langExtCache.has(languageId)) {
    return langExtCache.get(languageId)!;
  }
  for (const vsExt of vscode.extensions.all) {
    const langs = vsExt.packageJSON?.contributes?.languages as
      | Array<{ id: string; extensions?: string[] }>
      | undefined;
    if (!langs) {
      continue;
    }
    for (const lang of langs) {
      if (lang.id === languageId && lang.extensions?.length) {
        const result = lang.extensions[0].replace(/^\./, "");
        langExtCache.set(languageId, result);
        return result;
      }
    }
  }
  langExtCache.set(languageId, languageId);
  return languageId;
}

// --- File icon theme loading ---

type IconPair = { light: vscode.Uri; dark: vscode.Uri };

interface ThemeCache {
  themeId: string | null;
  icons: Map<string, IconPair | null>;
}

let themeCache: ThemeCache | null = null;

function loadThemeIcons(themeId: string | null): Map<string, IconPair | null> {
  const map = new Map<string, IconPair | null>();
  if (!themeId) {
    return map;
  }

  for (const vsExt of vscode.extensions.all) {
    const contributed = vsExt.packageJSON?.contributes?.iconThemes as
      | Array<{ id: string; path: string }>
      | undefined;
    if (!contributed) {
      continue;
    }

    const entry = contributed.find((t) => t.id === themeId);
    if (!entry) {
      continue;
    }

    try {
      const themePath = path.join(vsExt.extensionPath, entry.path);
      const themeDir = path.dirname(themePath);
      const json = JSON.parse(fs.readFileSync(themePath, "utf8"));

      const toUri = (defKey: string): vscode.Uri | null => {
        const def = json.iconDefinitions?.[defKey];
        // Only SVG/PNG icon paths work as TreeItem iconPath — skip font-based definitions
        return def?.iconPath
          ? vscode.Uri.file(path.resolve(themeDir, def.iconPath))
          : null;
      };

      const pair = (darkKey: string, lightKey?: string): IconPair | null => {
        const dark = toUri(darkKey);
        if (!dark) {
          return null;
        }
        const light = lightKey ? (toUri(lightKey) ?? dark) : dark;
        return { light, dark };
      };

      const lightLangs: Record<string, string> = json.light?.languageIds ?? {};
      const lightExts: Record<string, string> = json.light?.fileExtensions ?? {};

      for (const [lang, key] of Object.entries(json.languageIds ?? {}) as [string, string][]) {
        map.set(lang, pair(key, lightLangs[lang]));
      }
      for (const [ext, key] of Object.entries(json.fileExtensions ?? {}) as [string, string][]) {
        map.set(`ext:${ext}`, pair(key, lightExts[ext]));
      }
    } catch {
      // Theme file unreadable — return whatever was built so far
    }
    break; // found the active theme extension, no need to continue
  }

  return map;
}

function getLanguageIcon(languageId: string): IconPair | vscode.ThemeIcon {
  const themeId =
    vscode.workspace.getConfiguration("workbench").get<string>("iconTheme") ??
    null;

  if (!themeCache || themeCache.themeId !== themeId) {
    themeCache = { themeId, icons: loadThemeIcons(themeId) };
  }

  // 1. Direct languageId match (theme's languageIds map)
  if (themeCache.icons.has(languageId)) {
    return themeCache.icons.get(languageId) ?? new vscode.ThemeIcon("code");
  }

  // 2. File extension match (theme's fileExtensions map)
  const ext = extensionForLanguage(languageId);
  const extKey = `ext:${ext}`;
  if (themeCache.icons.has(extKey)) {
    const icon = themeCache.icons.get(extKey)!;
    themeCache.icons.set(languageId, icon); // promote to languageId for next lookup
    return icon ?? new vscode.ThemeIcon("code");
  }

  themeCache.icons.set(languageId, null);
  return new vscode.ThemeIcon("code");
}

// --- Execution status ---

type ExecutionStatus = { icon: vscode.ThemeIcon; badge: string } | null;

function executionStatus(cell: vscode.NotebookCell): ExecutionStatus {
  const summary = cell.executionSummary;
  if (!summary || summary.executionOrder === undefined) {
    return null;
  }
  const badge = `[${summary.executionOrder}]`;
  if (summary.success === true) {
    return {
      icon: new vscode.ThemeIcon(
        "pass-filled",
        new vscode.ThemeColor("notebookStatusSuccessIcon.foreground")
      ),
      badge,
    };
  }
  if (summary.success === false) {
    return {
      icon: new vscode.ThemeIcon(
        "error",
        new vscode.ThemeColor("notebookStatusErrorIcon.foreground")
      ),
      badge,
    };
  }
  return {
    icon: new vscode.ThemeIcon(
      "circle-outline",
      new vscode.ThemeColor("notebookStatusRunningIcon.foreground")
    ),
    badge,
  };
}

// --- Markdown stripping ---

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

// --- Tree data provider ---

export class NotebookOutlineProvider
  implements vscode.TreeDataProvider<vscode.NotebookCell>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(cell: vscode.NotebookCell): vscode.TreeItem {
    const config = vscode.workspace.getConfiguration("notebookCellNumbers");
    const startFrom = config.get<number>("startFrom", 1);
    const cellNumber = cell.index + startFrom;
    const title = (cell.metadata?.title as string) || "";
    const isCode = cell.kind === vscode.NotebookCellKind.Code;

    // Build label
    let label: string;
    if (isCode) {
      label = title ? `Cell ${cellNumber}: ${title}` : `Cell ${cellNumber}`;
    } else {
      const firstLine =
        cell.document.lineCount > 0
          ? cell.document.lineAt(0).text.trim()
          : "";
      const stripped = stripMarkdown(firstLine);
      if (title) {
        label = `Cell ${cellNumber}: ${title}`;
      } else if (stripped) {
        label = `Cell ${cellNumber}: ${stripped}`;
      } else {
        label = `Cell ${cellNumber}`;
      }
    }

    const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);

    if (isCode) {
      const status = executionStatus(cell);
      if (status) {
        item.iconPath = status.icon;
      } else {
        item.iconPath = getLanguageIcon(cell.document.languageId);
      }

      // Description: [exec. ord.] first line
      const firstLine =
        cell.document.lineCount > 0
          ? cell.document.lineAt(0).text.trim()
          : "";
      const parts: string[] = [];
      if (status) {
        parts.push(status.badge);
      }
      if (firstLine) {
        parts.push(firstLine.substring(0, 60));
      }
      if (parts.length > 0) {
        item.description = parts.join(" ");
      }
    } else {
      item.iconPath = new vscode.ThemeIcon("markdown");
      if (title) {
        const firstLine =
          cell.document.lineCount > 0
            ? cell.document.lineAt(0).text.trim()
            : "";
        const stripped = stripMarkdown(firstLine);
        if (stripped) {
          item.description = stripped.substring(0, 60);
        }
      }
    }

    // Hover tooltip
    const content = cell.document.getText();
    const preview = content.substring(0, 300);
    const lang = isCode ? cell.document.languageId || "python" : "markdown";

    const tooltip = new vscode.MarkdownString();
    tooltip.appendMarkdown(
      `**Cell ${cellNumber}**${title ? `: ${title}` : ""}\n\n`
    );
    tooltip.appendCodeblock(
      preview + (content.length > 300 ? "\n..." : ""),
      lang
    );
    item.tooltip = tooltip;

    item.command = {
      command: "notebookCellNumbers.peekCell",
      title: "Peek Cell",
      arguments: [cell.index],
    };

    return item;
  }

  getChildren(): vscode.NotebookCell[] {
    const editor = vscode.window.activeNotebookEditor;
    if (!editor) {
      return [];
    }
    return [...editor.notebook.getCells()];
  }

  dispose(): void {
    this._onDidChangeTreeData.dispose();
  }
}
