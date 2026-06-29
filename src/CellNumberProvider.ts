import * as vscode from "vscode";

export class CellNumberProvider
  implements vscode.NotebookCellStatusBarItemProvider
{
  private _onDidChangeCellStatusBarItems = new vscode.EventEmitter<void>();
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
    const title = (cell.metadata?.metadata["application/vnd.databricks.v1+cell"]?.title as string) || "";

    let text = format.replace(/\{n\}/g, String(cellIndex));
    if (title) {
      text += `: ${title}`;
    }

    const item = new vscode.NotebookCellStatusBarItem(
      text,
      alignment === "right"
        ? vscode.NotebookCellStatusBarAlignment.Right
        : vscode.NotebookCellStatusBarAlignment.Left
    );

    item.command = "notebookCellNumbers.editCellTitle";
    item.tooltip = title
      ? `Cell ${cellIndex}: ${title} — click to edit title`
      : `Cell ${cellIndex} — click to add title`;

    return [item];
  }

  dispose(): void {
    this._onDidChangeCellStatusBarItems.dispose();
  }
}
