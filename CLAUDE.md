# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`reca-operator` is a client-side React 19 single-page app built with Vite 8 and TypeScript. It is currently the default Vite React-TS starter scaffold (`src/App.tsx` is the demo landing page) — treat it as a fresh baseline to build a real app on top of.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Type-check (tsc -b) then produce a production build in dist/
npm run lint      # Run ESLint over the repo
npm run preview   # Serve the production build locally
```

There is **no test runner configured** — no `test` script, no Vitest/Jest. Add one before writing tests.

`npm run build` runs `tsc -b` first, so a type error fails the build. Run `npx tsc -b` alone for a fast type-check without bundling.

## Architecture notes

- **TypeScript is split into project references**: `tsconfig.json` references `tsconfig.app.json` (app code under `src/`, browser/DOM libs, bundler module resolution, `noEmit`) and `tsconfig.node.json` (the Vite config itself, Node environment). `tsc -b` builds both. Put app code under `src/`; build tooling belongs to the node config.
- **App config is strict**: `noUnusedLocals`, `noUnusedParameters`, and `verbatimModuleSyntax` are on. Import types with `import type { ... }`, and don't leave unused bindings — they are hard errors.
- **Entry flow**: `index.html` loads `src/main.tsx`, which mounts `<App>` (from `src/App.tsx`) into `#root` via React's `createRoot` in `StrictMode`.
- **Static assets**: files in `public/` (e.g. `icons.svg`, `favicon.svg`) are served at the site root and referenced by absolute path (`/icons.svg`). Assets imported from `src/assets/` are processed/hashed by Vite. The SVG sprite pattern (`<use href="/icons.svg#...">`) is how icons are used.
```
