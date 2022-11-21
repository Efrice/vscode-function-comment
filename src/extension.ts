import * as vs from "vscode"
import { getFunctionNode, resolveComment } from "./main"

export function activate(context: vs.ExtensionContext) {
  const commandId = "function-comment.functionComment"
  const disposable = vs.commands.registerCommand(commandId, () => {
    const editor = vs.window.activeTextEditor
    if (!editor) {
      return
    }
    const { line } = editor.selection.active
    const languageType = editor.document.languageId

    if (!languageType) {
      return
    }

    try {
      const functionNode = getFunctionNode(
        editor.document.getText(),
        line + 1,
        languageType
      )
      const comment = functionNode && resolveComment(functionNode)
      if (comment && functionNode?.startLine) {
        editor.insertSnippet(
          new vs.SnippetString(comment),
          new vs.Position(functionNode!.startLine - 1, 0)
        )
      }
    } catch (error) {}
  })

  context.subscriptions.push(disposable)
}
