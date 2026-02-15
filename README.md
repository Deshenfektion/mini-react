# mini-react

A miniature React-like runtime built from scratch in TypeScript. No React dependency — the element model, virtual DOM, reconciler, hooks, event system, and DOM renderer are all implemented here, as an exercise in understanding how component frameworks actually work.

## Status

Under active development. Current progress:

- [x] Element model: `createElement`, virtual node tree, child normalization
- [x] JSX runtime (automatic transform: `jsx`, `jsxs`, `Fragment`)
- [x] DOM renderer (initial mount: host elements, text, fragments, props, listeners)
- [ ] Function components
- [ ] Reconciliation (diffing, keyed children)
- [ ] Hooks (`useState`, `useEffect`)
- [ ] Event delegation
- [ ] Examples

## Architecture

The guiding principle is React's own: **UI is a description, not a construction.** Components return cheap immutable objects (virtual nodes) describing what the UI should look like; a separate renderer is responsible for making the real DOM match that description with as few mutations as possible.

```
src/
  core/                element creation, jsx runtime, virtual node model
  dom/                 low-level DOM writes: attributes, properties, styles, listeners
  renderer/            mounting vnode trees into a container (createRoot)
  shared/              types, symbols, and JSX type definitions
  jsx-runtime.ts       entry consumed by the automatic JSX transform
  jsx-dev-runtime.ts   dev-transform entry (jsxDEV)
tests/                 mirrors src/, one test file per module
```

TSX works end to end without React: `tsconfig.json` sets `"jsx": "react-jsx"` with `"jsxImportSource": "mini-react"`, and matching path aliases in `tsconfig.json` and `vite.config.ts` resolve `mini-react/jsx-runtime` to this repository's source. The compiler emits `jsx(type, props, key)` calls against our runtime, and our exported `JSX` namespace supplies the types (`JSX.Element`, `IntrinsicElements`, `IntrinsicAttributes`) that make TSX type-check.

### Design decisions so far

- **Text is normalized at creation time.** String and number children become text virtual nodes (`TEXT_ELEMENT`) inside `createElement`, so every layer downstream (renderer, reconciler) operates on a single uniform node shape instead of branching on primitives everywhere.
- **Children are flattened and filtered at creation time.** Nested arrays (the natural output of `list.map(...)`) are flattened, and `null` / `undefined` / booleans are dropped. This is what makes idioms like `cond && <div/>` work, and it means the reconciler can assume a flat array of vnodes.
- **`key` is extracted out of props.** Keys are reconciliation metadata, not data for the component, so they live on the vnode itself — mirroring React's design. The JSX runtime receives `key` as a separate argument (the React 17+ transform contract) and falls back to a `key` found in spread props.
- **One normalization path.** `createElement` (classic) and `jsx`/`jsxs` (automatic transform) both funnel children through the same `normalizeChildren`, so every vnode in the system has an identical shape regardless of how it was authored.
- **The renderer is split from DOM writes.** `renderer/mount.ts` walks the vnode tree and decides _what_ to create; `dom/properties.ts` is the only module that knows _how_ a prop lands on a real node (attribute vs. property, style objects, `on*` listeners). This mirrors React's renderer/host-config split, which is what allows React DOM and React Native to share one reconciler.
- **`render` currently remounts.** Until the reconciler lands, re-rendering clears the container and mounts fresh. Correct, but O(tree) DOM work per render — the diffing phases exist to fix exactly this.

## Requirements

- Node.js >= 22

## Scripts

```
npm run dev            start the Vite dev server
npm test               run the test suite once
npm run test:watch     run tests in watch mode
npm run test:coverage  run tests with coverage
npm run typecheck      type-check without emitting
npm run lint           lint with ESLint
npm run format         format with Prettier
```
