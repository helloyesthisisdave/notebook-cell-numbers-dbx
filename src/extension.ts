import * as vscode from "vscode";
import { CellNumberProvider } from "./CellNumberProvider";
import { CellTocProvider } from "./CellTocProvider";
import { EditCellTitleCommand } from "./EditCellTitleCommand";
import { GotoCellCommand } from "./GotoCellCommand";
import { PeekCellCommand } from "./PeekCellCommand";

export function activate(context: vscode.ExtensionContext): void {
  const provider = new CellNumberProvider();
  const tocProvider = new CellTocProvider();

  // Status bar cell numbers
  context.subscriptions.push(
    vscode.notebooks.registerNotebookCellStatusBarItemProvider("*", provider),
    provider
  );

  // Cell TOC sidebar panel
  context.subscriptions.push(
    vscode.window.createTreeView("cellToc", {
      treeDataProvider: tocProvider,
      showCollapseAll: false,
    }),
    tocProvider
  );

  // Refresh both providers when config, cells, or notebooks change
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("notebookCellNumbers")) {
        provider.refresh();
        tocProvider.refresh();
      }
    }),
    vscode.workspace.onDidChangeNotebookDocument(() => {
      provider.refresh();
      tocProvider.refresh();
    }),
    vscode.window.onDidChangeActiveNotebookEditor(() => {
      tocProvider.refresh();
    })
  );

  // Commands
  GotoCellCommand.register(context);
  EditCellTitleCommand.register(context);
  PeekCellCommand.register(context);
}

export function deactivate(): void {}
