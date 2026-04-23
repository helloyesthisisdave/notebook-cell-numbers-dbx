import * as vscode from "vscode";

/**
 * Notebook Cell Numbers
 *
 * Adds a persistent cell index number (e.g. "Cell 1", "Cell 2", …)
 * to the status bar of every notebook cell, so you always know
 * which cell you're looking at — even before executing anything.
 */

class CellNumberProvider implements vscode.NotebookCellStatusBarItemProvider {
  private _onDidChangeCellStatusBarItems =
    new vscode.EventEmitter<void>();
  readonly onDidChangeCellStatusBarItems =
    this._onDidChangeCellStatusBarItems.event;

  /** Call this whenever config changes or cells are reordered */
  refresh(): void {
    this._onDidChangeCellStatusBarItems.fire();
  }

  provideCellStatusBarItems(
    cell: vscode.NotebookCell,
    _token: vscode.CancellationToken
  ): vscode.NotebookCellStatusBarItem[] {
    const config = vscode.workspace.getConfiguration("notebookCellNumbers");

    if (!config.get<boolean>("enabled", true)) {
      return [];
    }

    const startFrom = config.get<number>("startFrom", 1);
    const format = config.get<string>("format", "Cell {n}");
    const alignment = config.get<string>("alignment", "left");

    const cellIndex = cell.index + startFrom;
    const text = format.replace(/\{n\}/g, String(cellIndex));

    const item = new vscode.NotebookCellStatusBarItem(
      text,
      alignment === "right"
        ? vscode.NotebookCellStatusBarAlignment.Right
        : vscode.NotebookCellStatusBarAlignment.Left
    );

    item.tooltip = `Cell index: ${cellIndex} (position ${cell.index})`;

    return [item];
  }

  dispose(): void {
    this._onDidChangeCellStatusBarItems.dispose();
  }
}

export function activate(context: vscode.ExtensionContext): void {
  const provider = new CellNumberProvider();

  // Register for all notebook types
  context.subscriptions.push(
    vscode.notebooks.registerNotebookCellStatusBarItemProvider("*", provider)
  );

  // Refresh when configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("notebookCellNumbers")) {
        provider.refresh();
      }
    })
  );

  context.subscriptions.push(provider);
}

export function deactivate(): void {}
