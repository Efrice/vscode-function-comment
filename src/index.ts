interface Line {
  isFunction?: boolean
  code: string
  loc: {
    startLine: number
    endLine?: number
  }
}

interface ParamNode {
  name: string
  type: string
}

export interface FunctionNode {
  startLine: number
  params: ParamNode[]
  returnType?: string
}

export function lines(code: string): Line[] {
  return code.split("\n").map((val, index) => {
    return {
      code: val.trim(),
      loc: {
        startLine: index,
      },
    }
  })
}

export function resolveFunctionEndLine(lines: Line[]) {
  const braceStack: Line[] = [],
    functionLineStack: Line[] = []
  let isFunction = false

  lines.forEach((item) => {
    const { code } = item
    if (code.includes("function ") || code.includes("=>")) {
      isFunction = true
      item.isFunction = true
      functionLineStack.push(item)
    }
    if (isFunction && item.code.includes("{")) {
      braceStack.push(item)
    }
    if (isFunction && item.code.includes("}")) {
      braceStack.pop()
      const currentFunction = functionLineStack.pop()
      currentFunction!.loc.endLine = item.loc.startLine
    }
    if (functionLineStack.length === 0) {
      isFunction = false
    }
  })
}

export function getTargetFunctionLines(lines: Line[], line: number): Line[] {
  let targeFunctionLines: Line[] = [],
    isTargetFunction = false
  lines.forEach((item) => {
    const { code, isFunction, loc } = item
    if (
      isFunction &&
      line >= loc.startLine &&
      loc.endLine &&
      line <= loc.endLine
    ) {
      isTargetFunction = true
    }
    if (isTargetFunction) {
      targeFunctionLines.push(item)
    }
    if (code.includes("{")) {
      isTargetFunction = false
    }
  })
  let functionIndexs: number[] = []
  targeFunctionLines.forEach((item, index) => {
    if (item.isFunction) {
      functionIndexs.push(index)
    }
  })
  if (functionIndexs.length === 1) {
    return targeFunctionLines
  } else {
    return targeFunctionLines.slice(functionIndexs[functionIndexs.length - 1])
  }
}

export function getFunctionNode(lines: Line[]): FunctionNode {
  const functionNode: FunctionNode = {
    startLine: 0,
    params: [],
    returnType: "",
  }
  if (lines.length === 0) {
    return functionNode
  }
  functionNode.startLine = lines[0].loc.startLine
  let functionCode = ""
  lines.forEach((item) => {
    functionCode += item.code
  })
  const args = functionCode.match(/\([^\(\)]+\)/)
  if (args !== null) {
    const functionParamsCode = args[0].substring(1, args[0].length - 1)
    functionNode.params = resolveParams(functionParamsCode)
  }
  const returns = functionCode.match(/\):([\W\w]+)(=>)?\{?/)
  if (returns !== null) {
    functionNode.returnType = resolveReturnType(returns[0])
  }
  return functionNode
}

function resolveParams(code: string): ParamNode[] {
  const paramsNodes: ParamNode[] = []
  if (!code.includes("=") && !code.includes(":")) {
    const params = code.split(",")
    params.forEach((item) => {
      paramsNodes.push({
        name: item.trim(),
        type: "",
      })
    })
  } else {
    const params = code.split(",")
    params.forEach((item) => {
      if (item.includes("=")) {
        const nameType = item.trim().split("=")
        paramsNodes.push({
          name: `[${item.trim()}]`,
          type: (nameType[1] && resolveType(nameType[1].trim())) || "",
        })
      } else {
        const nameType = item.trim().split(":")
        paramsNodes.push({
          name: nameType[0].trim(),
          type: nameType[1].trim() || "",
        })
      }
    })
  }
  return paramsNodes
}

const isBoolean = (val: string): boolean => val === "true" || val === "false"
const isString = (val: string): boolean => /['"a-z]+/i.test(val)
const isNumber = (val: string): boolean => /[0-9]+/.test(val)

const typeMap: Record<string, Function> = {
  boolean: isBoolean,
  string: isString,
  number: isNumber,
}

function resolveType(val: string) {
  for (const key in typeMap) {
    const fn = typeMap[key]
    if (fn(val)) {
      return key
    }
  }
  return "*"
}

function resolveReturnType(val: string) {
  return val
    .substring(2, val.length - 1)
    .replace(/=>[\W\w]+/g, "")
    .trim()
}

function resolveComment(functionNode: FunctionNode) {
  const commentStart = `/**
 * $1
 *
`
  const commentEnd = ` */
`
  if (!functionNode) {
    return
  }
  const { params, returnType } = functionNode
  let paramsStr = "",
    returnStr = ""
  if (params?.length > 0) {
    params.forEach((ele, index) => {
      if (ele.type) {
        paramsStr += ` * @param {${ele.type}} ${ele.name} $${index + 2} \n`
      } else {
        paramsStr += ` * @param ${ele.name} $${index + 2} \n`
      }
    })
  }
  if (returnType) {
    returnStr = ` * @return {${returnType}} $${params?.length + 2} \n`
  } else {
    returnStr = ` * @return $${params?.length + 2} \n`
  }

  return commentStart + paramsStr + returnStr + commentEnd
}

export function getComment(code: string, line: number) {
  const originLines = lines(code)
  resolveFunctionEndLine(originLines)
  const targetFunctionLines = getTargetFunctionLines(originLines, line)
  const functionNode = getFunctionNode(targetFunctionLines)
  return {
    comment: functionNode && resolveComment(functionNode),
    startLine: functionNode?.startLine,
  }
}
