# Notebook Cell Numbers

> Persistent cell numbers, editable titles, and a Table of Contents sidebar for every VS Code notebook.

No more manually counting cells or hunting for the right one — each cell displays its position directly in the status bar, and a sidebar TOC lets you jump anywhere instantly.

Works on VS Code, VSCodium, and Code OSS.

---

## Features

- **Persistent cell numbers** — shown on every cell, both code and markdown
- **Editable cell titles** — set a custom label per cell, stored in notebook metadata
- **Cell Table of Contents** — sidebar panel listing all cells with content hover-preview and peek navigation
- **Go to Cell command** — jump to any cell by number or title from the command palette
- **Universal** — works with Jupyter notebooks, interactive windows, and any other VS Code notebook type
- **Auto-updating** — numbers stay correct when cells are added, removed, or reordered
- **Fully configurable** — control the format string, starting index, and alignment

---

## Cell Table of Contents

The **Cell Table of Contents** panel appears in the Explorer sidebar. It lists every cell in the active notebook, lets you hover to preview cell contents, and click to jump directly to that cell.

---

## Commands

| Command | Description |
|---|---|
| `Notebook Cell Numbers: Go to Cell...` | Jump to any cell by number or title |
| `Notebook Cell Numbers: Edit Cell Title` | Set a custom title for the focused cell |

---

## Settings

| Setting | Default | Description |
|---|---|---|
| `notebookCellNumbers.enabled` | `true` | Show or hide cell numbers |
| `notebookCellNumbers.startFrom` | `1` | Starting number (`0` for zero-indexed) |
| `notebookCellNumbers.format` | `Cell {n}` | Label format — `{n}` is replaced with the cell number |
| `notebookCellNumbers.alignment` | `left` | Position in the status bar: `left` or `right` |

### Format examples

| Format string | Output |
|---|---|
| `Cell {n}` | Cell 1, Cell 2, Cell 3 |
| `In [{n}]` | In [1], In [2], In [3] |
| `#{n}` | #1, #2, #3 |
| `[{n}]` | [1], [2], [3] |

---

## Installation from source

```bash
# Clone the repository
git clone https://github.com/ostew5/notebook-cell-numbers
cd notebook-cell-numbers

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package as .vsix (requires vsce)
npx @vscode/vsce package

# Install in VS Code
# Extensions panel → ⋯ menu → "Install from VSIX…"
```

---

## How it works

The extension uses VS Code's `NotebookCellStatusBarItemProvider` API to inject a label into every cell's built-in status bar — no custom renderers, no webviews, no DOM manipulation. Cell titles are stored in notebook metadata so they persist with the file. The TOC panel is a native VS Code tree view that re-renders automatically as the notebook changes.

---

## License

[MIT](LICENSE.txt)
