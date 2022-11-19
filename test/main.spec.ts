import { test, expect } from "vitest"
import { getFunctionNode } from "../src/main"

let code = `
(a, b) => {
  return a > b
}
`
test.only("is FunctionDeclaration ", () => {
  const fn = getFunctionNode(code, 10, "js")
})

test("is ArrowFunctionExpression ", () => {
  // const fn = getFunctionNode(code, 0)
  // expect(fn).toEqual({
  //   params: [
  //     {
  //       name: "a",
  //       type: "",
  //     },
  //     {
  //       name: "b",
  //       type: "",
  //     },
  //   ],
  //   return: true,
  // })
})

test("compile vue", () => {})
