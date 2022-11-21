import { test, expect } from "vitest"
import { getFunctionNode } from "../src/main"
import type { FunctionNode } from "../src/main"

const functionJSNode: FunctionNode = {
  startLine: 2,
  params: [
    { name: "a", type: "" },
    { name: "b", type: "" },
  ],
  return: true,
  returnType: "",
}

const functionDeclarationJScode = `
function sum(a, b) {
  return a + b
}
`
test("is JS FunctionDeclaration ", () => {
  const node = getFunctionNode(functionDeclarationJScode, 2, "javascript")
  expect(node).toEqual(functionJSNode)
})

const functionExpressionJScode = `
const sum = function (a, b) {
  return a + b
}
`
test("is JS FunctionExpression ", () => {
  const node = getFunctionNode(functionExpressionJScode, 2, "javascript")
  expect(node).toEqual(functionJSNode)
})

const arrowFunctionExpressionJScode = `
const sum = (a, b) => {
  return a + b
}
`
test("is JS ArrowFunctionExpression ", () => {
  const node = getFunctionNode(arrowFunctionExpressionJScode, 2, "javascript")
  expect(node).toEqual(functionJSNode)
})

const functionTSNode: FunctionNode = {
  startLine: 2,
  params: [
    { name: "a", type: "number" },
    { name: "b", type: "number" },
  ],
  return: true,
  returnType: "number",
}

const functionDeclarationTScode = `
function sum(a: number, b: number): number {
  return a + b
}
`
test("is TS FunctionDeclaration ", () => {
  const node = getFunctionNode(functionDeclarationTScode, 2, "typescript")
  expect(node).toEqual(functionTSNode)
})

const functionExpressionTScode = `
const sum = function (a: number, b: number): number {
  return a + b
}
`
test("is TS FunctionExpression ", () => {
  const node = getFunctionNode(functionExpressionTScode, 2, "typescript")
  expect(node).toEqual(functionTSNode)
})

const arrowFunctionExpressionTScode = `
const sum = (a: number, b: number): number => {
  return a + b
}
`
test("is TS ArrowFunctionExpression ", () => {
  const node = getFunctionNode(arrowFunctionExpressionTScode, 2, "typescript")
  expect(node).toEqual(functionTSNode)
})

const vueOptionsAPICode = `
<template>
  <div></div>
</template>

<script>
export default {
  data() {
    return {
      a: "",
    }
  },
  methods: {
    sum(a, b) {
      return a + b
    },
  },
}
</script>

<style scoped></style>
`
test("is Vue Options API JS FunctionExpression ", () => {
  const node = getFunctionNode(vueOptionsAPICode, 15, "vue")
  functionJSNode.startLine = 14
  expect(node).toEqual(functionJSNode)
})

const vueCompositionAPICode = `
<template>
<div></div>
</template>

<script setup>
function sum(a, b) {
  return a + b
}
</script>

<style scoped></style>
`

test("is Vue Composition API JS FunctionExpression ", () => {
  const node = getFunctionNode(vueCompositionAPICode, 8, "vue")
  functionJSNode.startLine = 7
  expect(node).toEqual(functionJSNode)
})

const vueCompositionAPITSCode = `
<template>
<div></div>
</template>

<script setup lang="ts">
function sum(a: number, b: number): number {
  return a + b
}
</script>

<style scoped></style>
`

test("is Vue Composition API TS FunctionExpression ", () => {
  const node = getFunctionNode(vueCompositionAPITSCode, 8, "vue")
  functionTSNode.startLine = 7
  expect(node).toEqual(functionTSNode)
})
