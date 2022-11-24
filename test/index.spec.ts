import { test, expect } from "vitest"

import {
  lines,
  resolveFunctionEndLine,
  getTargeFunctionLines,
  getFunctionNode,
} from "../src/index"

const code = `
function sum(a, b) {
  return a + b
}
`

test("lines", () => {
  expect(lines(code)).toEqual([
    { code: "", loc: { startLine: 0 } },
    { code: "function sum(a, b) {", loc: { startLine: 1 } },
    { code: "return a + b", loc: { startLine: 2 } },
    { code: "}", loc: { startLine: 3 } },
    { code: "", loc: { startLine: 4 } },
  ])
})

test("resolveFunctionEndLine", () => {
  const originLines = lines(code)
  resolveFunctionEndLine(originLines)

  expect(originLines).toEqual([
    { code: "", loc: { startLine: 0 } },
    {
      code: "function sum(a, b) {",
      isFunction: true,
      loc: { startLine: 1, endLine: 3 },
    },
    { code: "return a + b", loc: { startLine: 2 } },
    { code: "}", loc: { startLine: 3 } },
    { code: "", loc: { startLine: 4 } },
  ])
})

test("getTargeFunctionLines", () => {
  const originLines = lines(code)
  resolveFunctionEndLine(originLines)
  const targetFunctionLines = getTargeFunctionLines(originLines, 3)

  expect(targetFunctionLines).toEqual([
    {
      code: "function sum(a, b) {",
      isFunction: true,
      loc: { startLine: 1, endLine: 3 },
    },
  ])
})

test("getFunctionNode", () => {
  const originLines = lines(code)
  resolveFunctionEndLine(originLines)
  const targetFunctionLines = getTargeFunctionLines(originLines, 3)
  const functionNode = getFunctionNode(targetFunctionLines)

  expect(functionNode).toEqual({
    startLine: 1,
    params: [
      { name: "a", type: "" },
      { name: "b", type: "" },
    ],
    returnType: "",
  })
})

const code1 = `
const sum = function (a: number, b = 2): number {
  return a + b
}
`

test("TS getFunctionNode", () => {
  const originLines = lines(code1)
  resolveFunctionEndLine(originLines)
  const targetFunctionLines = getTargeFunctionLines(originLines, 3)
  const functionNode = getFunctionNode(targetFunctionLines)
  expect(functionNode).toEqual({
    startLine: 1,
    params: [
      { name: "a", type: "number" },
      { name: "[b = 2]", type: "number" },
    ],
    returnType: "number",
  })
})
