import * as vscode from "vscode";
import { CellNumberProvider } from "./CellNumberProvider";

export function activate(context: vscode.ExtensionContext): void {
  const provider = new CellNumberProvider();

  context.subscriptions.push(
    vscode.notebooks.registerNotebookCellStatusBarItemProvider("*", provider),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("notebookCellNumbers")) {
        provider.refresh();
      }
    }),
    provider
  );
}

export function deactivate(): void {}
