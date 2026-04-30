# AI Usage Record

This document records how AI tooling was used to deliver the CLO-SET CONNECT
Store challenge submission, per the assignment guideline that requires a
detailed record of AI activity.

## Tooling

| Tool / Model | Role |
| --- | --- |
| Claude Opus 4.7 (1M context) via Claude Code (CLI) | Primary pair-programmer driving analysis, refactor planning, implementation, and verification. |
| Claude Code subagents (`oh-my-claudecode/ralph` workflow) | PRD-driven persistence loop: refines the user-story list (`prd.json`), executes story-by-story, runs build / lint / tests as verification, and keeps iterating until every acceptance criterion is met. |
| Playwright (MCP browser) | Live in-browser smoke testing of the rebuilt store: viewport breakpoints, infinite scroll, URL hydration, slider activation, empty / error states. |
| Vitest + React Testing Library | AI-authored unit and component tests (56 cases, all green) covering filtering, sorting, URL state, store actions, the slider/filter UI, and the ContentsList integration (no-result, error, filter end-to-end). |

No code was generated and accepted blindly — every AI suggestion was reviewed
in-context, executed against the test suite, and verified in the browser before
being committed to the diff.

## Workflow Summary

1. **Static analysis of the legacy app** (Claude Opus 4.7).
   The CLI read every file under `src/`, the README, the eslint config, and the
   tsconfig. It produced a triage list of bugs and gaps (see `docs/REFACTOR_NOTES.md`).
2. **PRD scaffolding** (`ralph` workflow).
   A 10-story PRD was written under `.omc/state/sessions/<id>/prd.json` with
   concrete, testable acceptance criteria for every requirement in the brief.
3. **Iterative implementation.**
   Stories were implemented one-by-one. After each batch, the loop ran
   `npm run lint`, `npm run build`, and `npm test` and refused to mark the story
   complete unless the artifacts passed.
4. **Browser verification** with Playwright MCP — clicked the Paid filter,
   exercised the slider, hydrated state from a URL, ran the search filter,
   verified the empty state, and captured the four responsive breakpoints
   (≤480, ≤768, ≤1200, >1200).

## Representative Prompts

The CLI session was driven from a single user prompt — the original challenge
brief, prefixed with `/ralph` to invoke the persistence loop. The agent then
self-prompted iteratively. Examples of internally generated tasks:

- "Write `applyFilters(items, state)` and `applySort(items, sort)` as pure
  functions. Pricing OR semantics, case-insensitive search on title+creator,
  inclusive numeric price range that only applies when PAID is selected, sort
  by numeric price (not string)."
- "Move all filter state into a Zustand store. Hydrate from `window.location.search`
  on first render and write back via `history.replaceState` on every change.
  Reset must restore _every_ field to its initial value."
- "Replace the `useEffect(loadData, [searchKeyword, selectedPricingOptions])`
  in App.tsx with a single Tanstack Query `useQuery` keyed by `['contents']`."
- "ContentsList: render skeletons during the initial fetch _and_ while
  appending more items, use `item.id` as the React key, render an EmptyState
  component when the filtered list is empty, and clean up the IntersectionObserver
  on unmount."

## Why these libraries?

| Library | Why |
| --- | --- |
| **Zustand** | Tiny (≈1 kB) global store with native subscribe-on-selector support, used to mirror filter state to the URL without wrapping the tree in a context provider. |
| **TanStack Query** | Off-the-shelf request lifecycle (loading / error / retry / cache) and a single source of truth for `ContentItem[]`, replacing the buggy `useEffect`-based loader. |
| **Vitest + React Testing Library** | First-party Vite integration, jsdom environment, and component-level testing without bringing in Jest. Aligns with `react@19` and Vite 8. |
| **@emotion/styled (kept)** | Already a dependency; reused for the header / search shell to minimise churn. New components use plain CSS files for clarity. |

## Trade-offs and known limitations

- **No virtualisation.** With ~140 items the dataset fits in memory. If the API
  grows, the next step is `react-virtuoso` or `@tanstack/react-virtual`.
- **Slider is implemented with two stacked `<input type="range">`.** Lightweight
  and accessible, but pixel-perfect dual-handle UX (e.g. dragging from the
  middle of the track, touch-friendly hit targets) would warrant a dedicated
  library such as `react-aria` `Slider`.
- **URL is the only persistence layer.** This was an explicit constraint in the
  brief. Browser back / forward (popstate) is wired up; closing the tab loses
  state, which matches expectations for a public store page.
- **Tests focus on logic + filter UI.** The full E2E flow was verified by hand
  with Playwright MCP; a dedicated Playwright suite is the natural next step
  beyond the 24-hour scope.
