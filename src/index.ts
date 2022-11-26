interface ParamNode {
  name: string
  type: string
}

interface FunctionNode {
  params: ParamNode[]
  returnType?: string
}

interface FunctionMsg {
  isNormalJSFunction: boolean
  isArrowJSFunction: boolean
  isNormalTSFunction: boolean
  isArrowTSFunction: boolean
  startLine: number
}

interface Snippet {
  comment: string
  startLine: number
}

function getLines(code: string): string[] {
  return code.split("\n")
}
function isFunction(lines: string[], line: number): FunctionMsg {
  let code = lines[line],
    nextCode = lines[line + 1]
  const nextTwoCode = lines[line + 2],
    functionMsg = {
      isNormalJSFunction: false,
      isArrowJSFunction: false,
      isNormalTSFunction: false,
      isArrowTSFunction: false,
      startLine: line,
    }
  if (code.includes("function ")) {
    if (code.includes(":") || nextCode.includes(":")) {
      functionMsg["isNormalTSFunction"] = true
    } else {
      functionMsg["isNormalJSFunction"] = true
    }
    return functionMsg
  }
  if (nextCode.includes("function ")) {
    functionMsg["startLine"] = line + 1
    if (nextCode.includes(":") || nextTwoCode.includes(":")) {
      functionMsg["isNormalTSFunction"] = true
    } else {
      functionMsg["isNormalJSFunction"] = true
    }
    return functionMsg
  }
  if (code.includes("=>")) {
    let startLine = line,
      paramsStr = ""
    while (!code.includes("(") && startLine >= 0) {
      code = lines[--startLine]
      paramsStr += code
    }
    if (paramsStr.includes(":") || nextCode.includes(":")) {
      functionMsg["isArrowTSFunction"] = true
    } else {
      functionMsg["isArrowJSFunction"] = true
    }
    functionMsg["startLine"] = startLine
    return functionMsg
  }
  if (nextCode.includes("=>")) {
    let startLine = line + 1,
      paramsStr = ""
    while (!nextCode.includes("(") && startLine >= 0) {
      nextCode = lines[--startLine]
      paramsStr += nextCode
    }
    if (paramsStr.includes(":") || nextTwoCode.includes(":")) {
      functionMsg["isArrowTSFunction"] = true
    } else {
      functionMsg["isArrowJSFunction"] = true
    }
    functionMsg["startLine"] = startLine
    return functionMsg
  }
  return functionMsg
}

function getFunctionCode(lines: string[], functionMsg: FunctionMsg): string {
  let functionCode = ""

  const {
    isNormalJSFunction,
    isArrowJSFunction,
    isNormalTSFunction,
    isArrowTSFunction,
    startLine,
  } = functionMsg
  if (isNormalJSFunction || isNormalTSFunction) {
    for (let i = startLine; i < lines.length; i++) {
      const ele = lines[i]
      if (ele.includes("{")) {
        functionCode += ele
        break
      }
      functionCode += ele
    }
  }
  if (isArrowJSFunction || isArrowTSFunction) {
    for (let i = startLine; i < lines.length; i++) {
      const ele = lines[i]
      if (ele.includes("=>")) {
        functionCode += ele
        break
      }
      functionCode += ele
    }
  }
  return functionCode
}

function getFunctionNode(
  lines: string[],
  functionMsg: FunctionMsg
): FunctionNode {
  const functionNode: FunctionNode = {
    params: [],
    returnType: "",
  }
  if (lines.length === 0) {
    return functionNode
  }
  const functionCode = getFunctionCode(lines, functionMsg)
  const args = functionCode.match(/\([^\(\)]+\)/)
  if (args !== null) {
    const functionParamsCode = args[0].substring(1, args[0].length - 1)
    functionNode.params = resolveParams(functionParamsCode, functionMsg)
  }
  const returns = functionCode.match(/\):([\W\w]+)(=>)?\{?/)
  if (returns !== null) {
    functionNode.returnType = resolveReturnType(returns[0])
  }
  return functionNode
}

function resolveParams(code: string, functionMsg: FunctionMsg): ParamNode[] {
  const paramsNodes: ParamNode[] = [],
    {
      isNormalJSFunction,
      isArrowJSFunction,
      isNormalTSFunction,
      isArrowTSFunction,
    } = functionMsg
  if (isNormalJSFunction || isArrowJSFunction) {
    const params = code.split(",")
    params.forEach((item) => {
      paramsNodes.push({
        name: item.trim(),
        type: "",
      })
    })
  }
  if (isNormalTSFunction || isArrowTSFunction) {
    const originParams = code.split(","),
      params: string[] = []
    for (let i = 0; i < originParams.length; i++) {
      const ele = originParams[i]
      if (ele.includes(":") || ele.includes("=")) {
        params.push(ele)
      } else {
        params[params.length - 1] += "," + ele
      }
    }
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

function resolveType(val: string): string {
  for (const key in typeMap) {
    const fn = typeMap[key]
    if (fn(val)) {
      return key
    }
  }
  return "*"
}

function resolveReturnType(val: string): string {
  return val
    .substring(2, val.includes("{") ? val.length - 2 : val.length - 3)
    .replace(/=>[\W\w]+/g, "")
    .replace(/[\s]+/g, "")
    .trim()
}

function resolveComment(functionNode: FunctionNode): string {
  const commentStart = `/**
 * $1
 *
`
  const commentEnd = ` */
`
  if (!functionNode) {
    return ""
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

export function getComment(code: string, line: number): Snippet {
  const lines = getLines(code),
    functionMsg = isFunction(lines, line),
    {
      isNormalJSFunction,
      isArrowJSFunction,
      isNormalTSFunction,
      isArrowTSFunction,
      startLine,
    } = functionMsg
  if (
    !(
      isNormalJSFunction ||
      isArrowJSFunction ||
      isNormalTSFunction ||
      isArrowTSFunction
    )
  ) {
    return {
      comment: "",
      startLine: 0,
    }
  }
  const functionNode = getFunctionNode(lines, functionMsg)
  return {
    comment: (functionNode && resolveComment(functionNode)) || "",
    startLine: startLine,
  }
}
