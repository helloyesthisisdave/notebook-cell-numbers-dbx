import * as vscode from "vscode";

export class PeekCellCommand {
  static readonly id = "notebookCellNumbers.peekCell";

  static register(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        PeekCellCommand.id,
        (cellIndex: number) => new PeekCellCommand().execute(cellIndex)
      )
    );
  }

  execute(cellIndex: number): void {
    const editor = vscode.window.activeNotebookEditor;
    if (!editor) {
      return;
    }

    const range = new vscode.NotebookRange(cellIndex, cellIndex + 1);
    editor.selection = range;
    editor.revealRange(
      range,
      vscode.NotebookEditorRevealType.InCenterIfOutsideViewport
    );
  }
}
