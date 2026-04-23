# Notebook Cell Numbers

Adds persistent cell index numbers to the status bar of every notebook cell in VS Code.

No more manually counting cells — each cell displays its position (Cell 1, Cell 2, Cell 3…) directly in the cell's status bar area.

## Features

- Shows cell numbers on **every** notebook cell (code and markdown)
- Works with Jupyter notebooks, interactive windows, and any other notebook type
- Numbers update automatically when cells are added, removed, or reordered
- Fully configurable: starting index, format string, and alignment

## Settings

| Setting | Default | Description |
|---|---|---|
| `notebookCellNumbers.enabled` | `true` | Show/hide cell numbers |
| `notebookCellNumbers.startFrom` | `1` | Starting number (use `0` for zero-indexed) |
| `notebookCellNumbers.format` | `Cell {n}` | Format string — `{n}` is replaced with the number |
| `notebookCellNumbers.alignment` | `left` | Position in the cell status bar (`left` or `right`) |

### Format examples

- `Cell {n}` → Cell 1, Cell 2, Cell 3
- `In [{n}]` → In [1], In [2], In [3]
- `#{n}` → #1, #2, #3
- `[{n}]` → [1], [2], [3]

## Installation from source

```bash
# Clone or download this folder
cd notebook-cell-numbers

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package as .vsix (requires vsce)
npx @vscode/vsce package

# Install the .vsix in VS Code
# Extensions panel → ⋯ menu → "Install from VSIX…"
```

## How it works

The extension uses the `NotebookCellStatusBarItemProvider` API to inject a
small label into every cell's built-in status bar. This is lightweight — no
custom renderers, no webviews, no DOM hacking. The provider is called
automatically by VS Code whenever cells scroll into view or change.
