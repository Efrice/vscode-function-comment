import { test } from "vitest"
import { getFunctionNode } from "../src/main"

let code = `
function sum(a: boolean | string | T, b: boolean | string | T): boolean | string | T {
  return a + b
}
`

test("is FunctionDeclaration ", () => {
  const fn = getFunctionNode(code, 2, "js")
  console.log(fn)
})
