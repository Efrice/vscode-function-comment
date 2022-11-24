import * as vs from "vscode"
import { getComment } from "./index"

export function activate(context: vs.ExtensionContext) {
  const commandId = "function-comment.functionComment"
  const disposable = vs.commands.registerCommand(commandId, () => {
    const editor = vs.window.activeTextEditor
    if (!editor) {
      return
    }
    const { line } = editor.selection.active
    try {
      const { comment, startLine } = getComment(
        editor.document.getText(),
        line + 1
      )
      if (comment && startLine) {
        editor.insertSnippet(
          new vs.SnippetString(comment),
          new vs.Position(startLine, 0)
        )
      }
    } catch (error) {}
  })

  context.subscriptions.push(disposable)
}
