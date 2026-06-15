# React Calculator

A simple, modern calculator built with React 18 and Vite.

## Features

- Standard arithmetic: `+`, `−`, `×`, `÷`
- Percentage, sign toggle (`+/−`), decimals
- Keyboard support (digits, operators, `Enter`/`=`, `Backspace`, `Esc` to clear)
- Graceful handling of divide-by-zero and overflow (`Error` state)
- Responsive layout with a dark glassmorphism look

## Getting started

```bash
npm install
npm run dev
```

Then open the URL printed by Vite (usually http://localhost:5173).

## Scripts

- `npm run dev` — start the dev server with hot reload
- `npm run build` — produce a production build in `dist/`
- `npm run preview` — preview the production build locally

## Project structure

```
src/
  main.jsx          # React entry point
  App.jsx           # Renders the Calculator
  Calculator.jsx    # Calculator state machine + UI
  Calculator.css    # Calculator styles
  index.css         # Global styles / background
index.html
vite.config.js
```

## Keyboard shortcuts

| Key                 | Action          |
| ------------------- | --------------- |
| `0`–`9`             | Enter a digit   |
| `.`                 | Decimal point   |
| `+`, `-`, `*`, `/`  | Operator        |
| `Enter` or `=`      | Equals          |
| `Backspace`         | Delete last digit |
| `Escape`            | Clear all (AC)  |
| `%`                 | Percentage      |
