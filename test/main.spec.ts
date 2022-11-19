import { test, expect } from "vitest"
import { getFunctionNode } from "../src/main"

let code = `
(a, b) => {
  return a > b
}
`
test("is FunctionDeclaration ", () => {
  const fn = getFunctionNode(code, 10)
})

test("is ArrowFunctionExpression ", () => {
  const fn = getFunctionNode(code, 0)
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

test.only("compile vue", () => {
  const code = `
  <template>
	<div>

	</div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
	setup () {
		function setName () {
			return "name"
		}

		const name = "nihao"
		return {}
	}
})
</script>

<style scoped>

</style>
  `
})
