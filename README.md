# Function Comment

Generate function comment anywhere.

![function-comment](https://raw.githubusercontent.com/Efrice/function-comment/main/images/function-comment.gif)

## Usage

- default shortcut
  - win "ctrl + shift + /"
  - mac "cmd + shift + /"

## Vim keyBindings Setting

```json
"vim.visualModeKeyBindingsNonRecursive": [
  {
    "before": ["<leader>", "c"],
    "commands": ["function-comment.functionComment"]
  }
],
"vim.normalModeKeyBindingsNonRecursive": [
  {
    "before": ["<leader>", "c"],
    "commands": ["function-comment.functionComment"]
  }
]
```
✨ Happy hacking!

## Attention

The arrow function moves the cursor to the line where `=>` is located.
