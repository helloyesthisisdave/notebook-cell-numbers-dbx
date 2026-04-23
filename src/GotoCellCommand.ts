import * as vscode from "vscode";

export class GotoCellCommand {
  static readonly id = "notebookCellNumbers.gotoCell";

  static register(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
      vscode.commands.registerCommand(GotoCellCommand.id, () =>
        new GotoCellCommand().execute()
      )
    );
  }

  async execute(): Promise<void> {
    const editor = vscode.window.activeNotebookEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active notebook editor.");
      return;
    }

    const config = vscode.workspace.getConfiguration("notebookCellNumbers");
    const startFrom = config.get<number>("startFrom", 1);
    const cellCount = editor.notebook.cellCount;
    const minDisplay = startFrom;
    const maxDisplay = cellCount + startFrom - 1;

    const input = await vscode.window.showInputBox({
      prompt: `Go to cell number (${minDisplay}–${maxDisplay})`,
      placeHolder: String(minDisplay),
      validateInput: (value) => {
        const n = parseInt(value, 10);
        if (isNaN(n)) {
          return "Please enter a valid number.";
        }
        if (n < minDisplay || n > maxDisplay) {
          return `Cell number must be between ${minDisplay} and ${maxDisplay}.`;
        }
        return null;
      },
    });

    if (input === undefined) {
      return;
    }

    const cellIndex = parseInt(input, 10) - startFrom;
    const range = new vscode.NotebookRange(cellIndex, cellIndex + 1);
    editor.selection = range;
    editor.revealRange(range, vscode.NotebookEditorRevealType.InCenter);
  }
}
