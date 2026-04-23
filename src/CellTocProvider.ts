import * as vscode from "vscode";

export class CellTocProvider implements vscode.TreeDataProvider<vscode.NotebookCell> {
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

    const label = title
      ? `Cell ${cellNumber}: ${title}`
      : `Cell ${cellNumber}`;

    const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);

    // Show first line of content as description
    const firstLine = cell.document.lineCount > 0
      ? cell.document.lineAt(0).text.trim()
      : "";
    if (firstLine) {
      item.description = firstLine.substring(0, 60);
    }

    // Icon based on cell type
    item.iconPath = cell.kind === vscode.NotebookCellKind.Markup
      ? new vscode.ThemeIcon("markdown")
      : new vscode.ThemeIcon("code");

    // Single click peeks the cell
    item.command = {
      command: "notebookCellNumbers.peekCell",
      title: "Peek Cell",
      arguments: [cell.index],
    };

    // Rich hover tooltip with cell content preview
    const content = cell.document.getText();
    const preview = content.substring(0, 300);
    const lang = cell.kind === vscode.NotebookCellKind.Code
      ? (cell.document.languageId || "python")
      : "markdown";

    const tooltip = new vscode.MarkdownString();
    tooltip.appendMarkdown(
      `**Cell ${cellNumber}**${title ? `: ${title}` : ""}\n\n`
    );
    tooltip.appendCodeblock(
      preview + (content.length > 300 ? "\n..." : ""),
      lang
    );
    item.tooltip = tooltip;

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
