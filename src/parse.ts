import { parse as babelParse } from "@babel/parser"
import { ParserOptions } from "@babel/parser"

const BABEL_PARSER_OPTIONS: ParserOptions = {
  sourceType: "module",
  allowImportExportEverywhere: true,
  allowReturnOutsideFunction: true,
  startLine: 1,
  tokens: true,
  plugins: ["typescript"],
}

export function parse(code: string) {
  return babelParse(code, BABEL_PARSER_OPTIONS)
}
