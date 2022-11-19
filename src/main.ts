import { parse } from "./parse"
import traverse from "@babel/traverse"
import type { NodePath } from "@babel/traverse"
import {
  FunctionDeclaration,
  FunctionExpression,
  ArrowFunctionExpression,
  isBlockStatement,
  isNoop,
} from "@babel/types"
import { parse as complierSfc } from "@vue/compiler-sfc"

interface ParamNode {
  name: string
  type: string
}

interface FunctionNode {
  startLine: number
  params: ParamNode[]
  return: boolean
  returnType?: string
}

function isCursorFunction(line: number, start: number, end: number) {
  return line >= start && line <= end
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
      if (item.typeAnnotation && !isNoop(item.typeAnnotation)) {
        paramNode.type = resolveType(item.typeAnnotation.typeAnnotation)
      }
    } else if (
      item.type === "RestElement" &&
      item.argument.type === "Identifier"
    ) {
      paramNode.name = item.argument.name
    }
    return paramNode
  })
}
function resolveType(target: any) {
  if (target.type === "TSTypeReference") {
    return target.typeName.name
  } else if (target.type === "TSUnionType") {
    return target.types.map((item: any) => resolveType(item)).join(" | ")
  } else {
    const typeAnnotationMap: Record<string, string> = {
      TSBooleanKeyword: "boolean",
      TSNumberKeyword: "number",
      TSStringKeyword: "string",
    }
    return typeAnnotationMap[target.type]
  }
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
function resolveReturnType(
  path: NodePath<
    FunctionDeclaration | FunctionExpression | ArrowFunctionExpression
  >
) {
  if (path.node.returnType && !isNoop(path.node.returnType)) {
    return resolveType(path.node.returnType.typeAnnotation)
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
    const { descriptor } = complierSfc(code)
    if (descriptor.script) {
      ast = parse(descriptor.script.content)
      offset = descriptor.script!.loc.start.line - 1
    } else if (descriptor.scriptSetup) {
      ast = parse(descriptor.scriptSetup.content)
      offset = descriptor.scriptSetup!.loc.start.line - 1
    }
    functionPos = line - offset
  } else {
    functionPos = line
    ast = parse(code)
  }
  traverse(ast, {
    FunctionExpression: handleFunction,
    FunctionDeclaration: handleFunction,
    ArrowFunctionExpression: handleFunction,
    ObjectMethod: handleFunction,
  })

  function handleFunction(
    path: NodePath<
      FunctionDeclaration | FunctionExpression | ArrowFunctionExpression | any
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
        returnType: resolveReturnType(path),
      }
    }
  }
  return functionNode
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
  const { params, return: hasReturn, returnType } = functionNode
  let paramsStr = "",
    returnStr = ""
  if (params?.length > 0) {
    params.forEach((ele, index) => {
      if (ele.type) {
        paramsStr += ` * @param ${ele.name} {${ele.type}} $${index + 2} \n`
      } else {
        paramsStr += ` * @param ${ele.name} $${index + 2} \n`
      }
    })
  }
  if (hasReturn && returnType) {
    returnStr = ` * @return {${returnType}} $${params?.length + 2}`
  } else {
    returnStr = ` * @return $${params?.length + 2}`
  }

  return commentStart + paramsStr + returnStr + commentEnd
}
