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
    const dbxMetadata = { ...cell.metadata?.metadata };

    // Check for databricks metadata object and create a basic version if not found
    if (!dbxMetadata["application/vnd.databricks.v1+cell"]) {
      dbxMetadata["application/vnd.databricks.v1+cell"] = {"title": ""};
    }
    
    // Check for a title property and add one if not found
    if (!dbxMetadata["application/vnd.databricks.v1+cell"].title) {
        dbxMetadata["application/vnd.databricks.v1+cell"].title = "";
    }

    const currentTitle = (dbxMetadata["application/vnd.databricks.v1+cell"].title as string) || "";

    const newTitle = await vscode.window.showInputBox({
      prompt: "Enter a title for this cell (leave empty to remove)",
      value: currentTitle,
      placeHolder: "Cell title",
    });

    if (newTitle === undefined) {
      return; // cancelled
    }

    
    const updatedMetadata = { ...cell.metadata };
    dbxMetadata["application/vnd.databricks.v1+cell"].title = newTitle;
    updatedMetadata.metadata = dbxMetadata;

    const edit = new vscode.WorkspaceEdit();
    edit.set(cell.notebook.uri, [
      vscode.NotebookEdit.updateCellMetadata(cellIndex, updatedMetadata),
    ]);
    await vscode.workspace.applyEdit(edit);
  }
}
