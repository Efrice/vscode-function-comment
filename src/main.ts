import { parse } from "./parse"
import traverse from "@babel/traverse"
import type { NodePath } from "@babel/traverse"
import {
  FunctionDeclaration,
  FunctionExpression,
  ArrowFunctionExpression,
  isBlockStatement,
} from "@babel/types"
import * as complierSfc from "@vue/compiler-sfc"

interface ParamNode {
  name: string
  type: string
}

interface FunctionNode {
  startLine: number
  params: ParamNode[]
  return: boolean
}

function isCursorFunction(line: number, start: number, end: number) {
  return line >= start && line <= end
}

export function resolveComment(functionNode: FunctionNode) {
  const commentStart = `/**
 * $1
 *
`
  const commentEnd = `
 */
`
  if (!functionNode) {
    return
  }
  const { params, return: hasReturn } = functionNode
  let paramsStr = "",
    returnStr = ""
  if (params?.length > 0) {
    params.forEach((ele, index) => {
      paramsStr += ` * @param ${ele.name} $${index + 2} \n`
    })
  }
  if (hasReturn) {
    returnStr = ` * @return $${params?.length + 2}`
  }

  return commentStart + paramsStr + returnStr + commentEnd
}

function generateParams(
  path: NodePath<
    FunctionDeclaration | FunctionExpression | ArrowFunctionExpression
  >
) {
  return path.node?.params.map((item) => {
    let paramNode = {
      name: "",
      type: "",
    }
    if (item.type === "Identifier") {
      paramNode.name = item.name
    } else if (
      item.type === "RestElement" &&
      item.argument.type === "Identifier"
    ) {
      paramNode.name = item.argument.name
    }
    return paramNode
  })
}
function hasReturn(
  path: NodePath<
    FunctionDeclaration | FunctionExpression | ArrowFunctionExpression
  >
) {
  if (isBlockStatement(path.node.body)) {
    return path.node.body.body.some((item) => {
      if (item.type === "ReturnStatement") {
        return true
      }
    })
  }
}

export function getFunctionNode(
  code: string,
  line: number,
  languageType: string
): FunctionNode | undefined {
  let functionNode,
    ast,
    offset = 0,
    functionPos = 0
  if (languageType === "vue") {
    const { descriptor } = complierSfc.parse(code)
    offset = descriptor.script!.loc.start.line - 1
    functionPos = line - offset
    ast = parse(descriptor.script!.content)
  } else {
    functionPos = line
    ast = parse(code)
  }
  traverse(ast, {
    FunctionExpression: handleFunction,
    FunctionDeclaration: handleFunction,
    ArrowFunctionExpression: handleFunction,
  })

  function handleFunction(
    path: NodePath<
      FunctionDeclaration | FunctionExpression | ArrowFunctionExpression
    >
  ) {
    if (
      isCursorFunction(
        functionPos,
        path.node.loc!.start.line,
        path.node.loc!.end.line
      )
    ) {
      functionNode = {
        startLine:
          languageType === "vue"
            ? path.node.loc!.start.line + offset
            : path.node.loc!.start.line,
        params: generateParams(path),
        return: hasReturn(path),
      }
    }
  }
  return functionNode
}
