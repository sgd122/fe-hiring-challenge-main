# Refactor Notes — Legacy Bugs & Fixes

A condensed audit of the bugs detected in the legacy code and how each was
addressed in the refactor. Cross-reference with the diff and the `docs/AI_USAGE.md`
log for the AI-driven workflow.

## Architecture changes (high level)

| Before | After |
| --- | --- |
| Hand-rolled React `Context` provider in `src/context.ts` + `src/store.tsx` | Zustand store in `src/store/filters.ts` |
| `useEffect(fetchContents, [searchKeyword, …])` in `App.tsx` | TanStack Query `useContents()` keyed once on `['contents']` |
| `sessionStorage` for `searchKeyword` and `pricingOptions` | URL query parameters (`?q=…&pricing=0,1&sort=…&min=…&max=…&limit=…`) wired through `parseFiltersFromUrl` / `serializeFiltersToUrl` |
| Sort by `String(b.price).localeCompare(String(a.price))` | Numeric `b.price - a.price` (and ascending counterpart) |
| Hard-coded `gridTemplateColumns: 'repeat(4, 1fr)'` | Derived from a `useColumns` hook with breakpoints 480/768/1200 |
| `removeEventListener('resize', () => {})` (broken cleanup) | Stable handler reference, removed on unmount |
| Missing initial column compute (only after a resize event) | `useColumns` initialises from `window.innerWidth` synchronously |
| Skeletons only during the initial fetch | Skeletons during initial fetch _and_ while appending more items via infinite scroll |
| `displayedContents.map((item, index) => <ContentCard key={index} …/>)` | `<ContentCard key={item.id} …/>` |
| `<img …>` with no `alt` | Descriptive alt text using `${title} by ${creator}` |
| Slider local state, not wired to the filter | Slider reads/writes the store, disabled when `Paid` is not selected |
| Reset only cleared `pricingOptions` and `displayCount` | Reset returns _all_ fields (search keyword, pricing, sort, slider range, display count) to defaults |
| No "no results" view | Dedicated `EmptyState` component with a clear copy and a `role="status"` |
| `fetchContents` had no error handling | `ContentsFetchError`, response status check, JSON parse guard, array validation, per-item shape validation |

## Bug-by-bug ledger

1. **Re-fetching on every search/filter change.**
   `App.tsx` listed `[searchKeyword, selectedPricingOptions]` as dependencies of
   the load effect, hammering the API on every keystroke. Replaced with a
   one-shot React Query call.
2. **Numeric price sorting using string compare.** `Higher Price` actually
   sorted `'9'` before `'90'`. Fixed.
3. **Pricing slider disconnected.** Local-only state never reached the filter.
   Now bound to `priceRange` in the store, with disabled state when Paid is not
   selected. Inversion is prevented (min ≤ max, max ≥ min) but equal handles
   are intentionally allowed so an exact-price filter (e.g. `min === max ===
   50`) is selectable — the README requires inclusive endpoints. See
   `docs/AI_USAGE.md` Phase 10 for the post-review fix.
4. **Reset was incomplete.** Search keyword, sort, slider, and display count
   stayed put. Reset now restores every URL-backed field.
5. **`sessionStorage` violated the "no browser storage" rule.** Removed.
   `grep -r "sessionStorage|localStorage" src/` returns zero hits.
6. **Memory leak on resize listener.** `removeEventListener` received a
   different function reference. Hook now uses a stable handler.
7. **No initial column compute.** Until the first resize event, the legacy code
   showed 4 columns even on a phone. `useColumns` now seeds from
   `window.innerWidth`.
8. **`index` used as React key.** Caused unnecessary remounts and image
   flicker on filter changes. Now keyed by `item.id`.
9. **No `alt` on `<img>`.** Accessibility failure. Added.
10. **Skeleton not shown during infinite-scroll appends.** Now rendered as a
    second batch when `hasMore && !showInitialSkeletons`.
11. **No "No Result" state.** Added the `EmptyState` component with helpful
    copy.
12. **API error handling.** `fetch` no longer throws into the void; non-2xx
    responses surface as a typed `ContentsFetchError` and the UI shows a
    retry button.

## Notable additions

- `parseFiltersFromUrl` is defensive: invalid pricing values are dropped,
  out-of-range prices are clamped, reversed `min` / `max` are swapped, and
  `limit` is floored at the default.
- `serializeFiltersToUrl` only writes non-default keys, keeping the URL clean
  on the home page.
- The Tanstack Query client is configured with `retry: 2` and a 5 minute stale
  time so that filter changes never re-fetch — they re-derive the view from the
  cached `ContentItem[]`.

## Tests

`npm test` — 58 cases:

- `src/lib/filters.test.ts` — 16 cases (filter combinations, sort numerics, immutability)
- `src/lib/url-state.test.ts` — 14 cases (parse, defaults, clamps, roundtrip)
- `src/lib/format.test.ts` — 4 cases (price label formatting)
- `src/store/filters.test.ts` — 9 cases (store actions, reset, hydration)
- `src/components/PricingFilter.test.tsx` — 3 cases (UI behaviour, reset)
- `src/components/PricingSlider.test.tsx` — 7 cases (disabled, non-inversion, inclusive endpoint, store sync)
- `src/components/ContentsList.test.tsx` — 5 cases (renders, no-result, error, filter, idle-no-skeleton)
