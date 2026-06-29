import * as vscode from "vscode";

export class EditCellTitleCommand {
  static readonly id = "notebookCellNumbers.editCellTitle";

  static register(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
      vscode.commands.registerCommand(EditCellTitleCommand.id, () =>
        new EditCellTitleCommand().execute()
      )
    );
  }

  async execute(): Promise<void> {
    const editor = vscode.window.activeNotebookEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active notebook editor.");
      return;
    }

    const cellIndex = editor.selection.start;
    const cell = editor.notebook.cellAt(cellIndex);
    const currentTitle = (cell.metadata?.title as string) || "";
    const dbxObj = { ...cell.metadata["application/vnd.databricks.v1+cell"] };

    const newTitle = await vscode.window.showInputBox({
      prompt: "Enter a title for this cell (leave empty to remove)",
      value: currentTitle,
      placeHolder: "Cell title",
    });

    if (newTitle === undefined) {
      return; // cancelled
    }

    
    const metadata = { ...cell.metadata };
    dbxObj.title = newTitle;
    metadata["application/vnd.databricks.v1+cell"] = dbxObj;

    if (newTitle) {
      metadata.title = newTitle;
      // metadata["application/vnd.databricks.v1+cell"].title = newTitle;
    } else {
      delete metadata.title;

    }

    const edit = new vscode.WorkspaceEdit();
    edit.set(cell.notebook.uri, [
      vscode.NotebookEdit.updateCellMetadata(cellIndex, metadata),
    ]);
    await vscode.workspace.applyEdit(edit);
  }
}
