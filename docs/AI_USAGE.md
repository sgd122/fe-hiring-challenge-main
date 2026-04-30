# AI Usage Record

본 과제의 **AI 활용 가이드라인**(필수)에 따른 진행 기록입니다. 단순 코드
생성 의뢰가 아니라, 레거시 코드를 분석한 뒤 AI를 활용해 단계별로 설계 →
계획 → 구현 → 검증 → 리뷰까지 끌고 간 과정을 정리했습니다.

## 사용한 AI / 도구

| Tool / Model | Role |
| --- | --- |
| **Claude Opus 4.7 (1M context)** via Claude Code CLI | 메인 페어 프로그래머. 레거시 코드 정적 분석, 아키텍처 설계, 구현, 코드 리뷰까지 전 과정을 주도. |
| Claude Code subagents (`architect`, `executor`, `code-reviewer`) | 단계별 위임 — 검토는 architect, 구현은 executor, 리뷰는 code-reviewer로 분리해 self-approve를 방지. |
| **OpenAI Codex** (Adversarial Review CLI) | 별도 모델 관점의 적대적 리뷰. 마지막 단계에서 README와 구현 일관성 검증. |
| Playwright MCP (브라우저 자동화) | 실제 브라우저에서 4개 반응형 breakpoint, 무한 스크롤, URL 하이드레이션, 슬라이더 활성화, 빈 상태 등을 시각 검증. |
| Vitest + React Testing Library | AI가 작성한 단위/컴포넌트 테스트 56 cases (logic + URL state + store + filter UI + ContentsList integration). |

> **검토 원칙:** AI가 만든 코드는 한 줄도 그대로 받지 않았습니다. 매 단계
> 변경분을 검토 → 테스트 → 브라우저 확인을 거친 뒤에만 다음 단계로 넘어갔고,
> 작성과 리뷰는 별도 컨텍스트로 분리해 self-approve를 차단했습니다.

---

## 단계별 워크플로

### Phase 1. 레거시 코드 정적 분석 (Discovery)

**목표:** 무엇을 고쳐야 하는지 먼저 알아내기 — 요구사항을 만나기 전에
코드베이스의 현재 상태와 결함을 객관적으로 파악.

**수행 내용**
- Claude Opus 4.7로 `src/` 전체(`App.tsx`, `store.tsx`, `context.ts`,
  `api.ts`, `components/Content.tsx`, `Filter.tsx`, `Header.tsx`, CSS) +
  설정(`package.json`, `tsconfig.json`, `vite.config.ts`,
  `eslint.config.js`) 일괄 정독.
- 코드와 README의 요구사항/기능 동작 명확화 섹션을 1:1로 매핑하여 어떤
  요구사항이 누락되거나 잘못 구현됐는지 도출.

**결과 — 레거시 결함 12건 (`docs/REFACTOR_NOTES.md`에 정리)**

| 분류 | 결함 |
| --- | --- |
| 데이터 페칭 | `useEffect(load, [search, options])` 의존성으로 키스트로크마다 API 재호출 |
| 페칭 안정성 | 응답 status 검사 / JSON 파싱 / 배열 검증 / 에러 타입 모두 부재 |
| 상태 영속화 | `sessionStorage` 사용 (브리프 명시 금지 사항 위반) |
| Reset 로직 | 검색어 / 정렬 / 슬라이더 / displayCount 미초기화 |
| 정렬 | `String(price).localeCompare`로 가격 정렬 — 숫자 비교 실패 |
| 슬라이더 | 로컬 state라 store에 연결되지 않음 → 어떤 필터링도 안 함 |
| 슬라이더 | Paid 미선택 시 disabled 상태 부재 |
| 그리드 | `repeat(4, 1fr)` 하드코딩 — 반응형 컬럼 무시 |
| 메모리 누수 | `removeEventListener('resize', () => {})` (다른 함수 참조) |
| React key | 배열 index 사용 — 필터 변경 시 불필요 remount |
| 접근성 | `<img>` `alt` 누락 |
| UX | 추가 로드 중 Skeleton 미표시 / "결과 없음" 상태 부재 |

**프롬프트 예시**
> 레거시 `src/` 전체를 읽고 README의 기능 동작 명확화 섹션과 1:1로 매핑해
> 어떤 요구사항이 미구현/잘못 구현됐는지 결함 목록을 만들어줘. 가설 없이
> 코드 근거(파일:라인)로만 적시할 것.

---

### Phase 2. 아키텍처 설계 (Architecture Design)

**목표:** 레거시 결함을 한 번에 해소할 수 있는 구조 결정 — 단순 패치가
아니라 같은 부류의 버그가 다시 나오지 않도록.

**의사결정 매트릭스**

| 결정 항목 | 선택 | 이유 |
| --- | --- | --- |
| 전역 상태 | **Zustand** | Context+useReducer보다 가볍고, `subscribeWithSelector`로 URL 동기화를 wrapper 없이 구현 가능. 트리 전체 re-render 방지. |
| 데이터 페칭 | **TanStack Query** | 로딩/에러/캐시/리트라이를 표준화. 필터 변경 시 재페칭이 아니라 캐시에서 derive. |
| 상태 영속화 | **URL query param** | 브리프의 `localStorage/sessionStorage 지양` 조건 충족 + 새로고침/공유링크 안전. `parseFiltersFromUrl` / `serializeFiltersToUrl`로 양방향. |
| 테스트 | **Vitest + RTL + jsdom** | Vite 8 / React 19 / TS 6 환경과 first-party 호환. Jest 도입 시 ESM 설정 비용이 큼. |
| 스타일링 | **emotion 유지 + 일반 CSS 파일** | 레거시가 emotion을 이미 의존성으로 가지고 있어 churn 최소화. 새 컴포넌트는 평범한 글로벌 CSS로 명료하게. |
| 파일 구조 | `lib / api / store / hooks / components` | 순수 로직(lib) ↔ 데이터(api) ↔ 상태(store) ↔ React 훅(hooks) ↔ UI(components) 명확 분리. 각 레이어 단독 테스트 가능. |

**프롬프트 예시**
> Reset이 모든 필드를 초기화해야 하고, 새로고침 후 상태가 유지돼야 하고,
> browser storage는 금지야. 이 세 조건을 동시에 만족시키는 구조를 제안하고
> trade-off를 표로 정리해줘.

---

### Phase 3. PRD-기반 단계별 계획 수립 (Planning)

**목표:** 24시간 내 완료 가능한 단위로 작업을 쪼개고, 각 단위마다 **검증
가능한 acceptance criteria**를 미리 적어 놓기. "구현 끝"이 자기 평가가
아니라 객관적 통과 여부로 판정되도록.

**작성한 PRD — 10개 user story**

| # | Story | 핵심 acceptance criteria |
| --- | --- | --- |
| US-001 | 프로젝트 도구 설정 | zustand/tanstack-query/vitest/RTL 의존성 추가, vitest config 분리, `npm test` 스크립트 |
| US-002 | 순수 필터/정렬 로직 + 테스트 | OR 시맨틱, 대소문자 무시 검색, Paid일 때만 가격 범위 적용, 숫자 정렬, ≥10 테스트 |
| US-003 | URL 기반 상태 영속화 | parse/serialize 양방향, 잘못된 값 fallback, src/에서 localStorage/sessionStorage grep 0건 |
| US-004 | URL 동기 Zustand store | 모든 액션, Reset이 전체 필드 초기화, popstate 핸들링 |
| US-005 | TanStack Query API 레이어 | typed error, status/array/shape 검증, QueryClientProvider 래핑 |
| US-006 | 필터/정렬/검색 UI 컴포넌트 | store에 양방향 바인딩, "Item Name (Default)" 정확한 라벨 |
| US-007 | Pricing Slider | Paid 미선택 시 disabled, 핸들 교차 방지(min ≤ max-1, max ≥ min+1), 양 끝 포함 |
| US-008 | 반응형 그리드 + 무한 스크롤 + Skeleton + Empty State | 480/768/1200 breakpoint, item.id 키, alt, IntersectionObserver, 추가 로드 중 skeleton |
| US-009 | App 통합 | 레거시 useEffect 제거, lint/build/test 그린 |
| US-010 | 문서화 | AI 활용 기록, refactor diary, README submission 섹션 |

**의존성 순서:** 도구 → 순수 로직 → URL 상태 → store → API → UI → 통합 → 문서.
한 단계 통과 못하면 다음 단계로 못 넘어가게 강제.

**프롬프트 예시**
> 위 결함 목록과 브리프 요구사항을 합쳐 10개 user story로 쪼개줘. 각
> story마다 "구현 끝"을 객관적으로 판정할 수 있는 testable acceptance
> criteria를 3개 이상 적어. 의존성 순서대로 정렬할 것.

---

### Phase 4. TDD 기반 단계별 구현 (Implementation)

**목표:** 각 story를 RED → GREEN → REFACTOR 사이클로 구현. 단계마다
즉시 회귀 검증.

각 story를 끝낼 때마다 `npm run lint && npm run build && npm test` 셋
모두 통과해야 다음 story로 진입했습니다. 통과 못하면 architect 의견으로
원인 분석 후 재시도.

**구현 순서와 산출물**

1. **US-001 (도구 설정)** — Vitest 3 + Vite 8 호환 이슈(`vitest`가 자체 번들 Vite를 가져와 타입 충돌)를 발견 → `vite.config.ts` / `vitest.config.ts` 분리로 해결.
2. **US-002 (순수 로직)** — `src/lib/filters.ts`에 `applyFilters` / `applySort` / `applyFiltersAndSort` 작성. **테스트 먼저** 작성한 뒤 구현 (16 cases). 핵심 가드: 가격 범위는 Paid 선택 시에만 적용 + 양 끝 포함, 정렬은 `localeCompare` 또는 숫자 차.
3. **US-003 (URL 상태)** — `parseFiltersFromUrl` / `serializeFiltersToUrl` (14 cases). 잘못된 pricing csv는 drop, 0~999 범위 밖은 clamp, min>max는 swap.
4. **US-004 (Zustand store)** — `subscribeWithSelector`로 URL 슬라이스 변화에만 `history.replaceState` 호출 (전체 상태 변경마다 URL 변화 방지). `popstate` 리스너로 뒤로가기 처리. 9 cases.
5. **US-005 (TanStack Query)** — `ContentsFetchError` 타입, status/JSON/array/per-item shape 검증. `staleTime: 5 min`으로 필터 변경 시 재페칭 안 일어남.
6. **US-006~008 (UI)** — 레거시 `Content.tsx` / `Filter.tsx` 한 파일에 모여있던 8개 컴포넌트를 `SearchBar / PricingFilter / Sorting / PricingSlider / ContentCard / SkeletonCard / EmptyState / ContentsList`로 분리. 각각 단일 책임.
7. **US-008 (특히)** — `useColumns` 훅이 lazy `useState` 초기값으로 SSR-safe하게 첫 렌더부터 정확한 컬럼 수 반환. 슬라이더 비활성화는 `disabled` 속성 + CSS opacity 0.45.
8. **US-009 (통합)** — `App.tsx`에서 레거시 useEffect 제거, `startUrlSync()`만 mount 시 1회.

**프롬프트 예시 (각 단계마다 자체 생성)**
> US-007을 구현해. PricingSlider는 store의 `priceRange`에 양방향 바인딩,
> Paid 미선택 시 두 input 모두 `disabled`. min 핸들은 max-1을 초과 못
> 하고, max 핸들은 min+1 미만 못 가도록 클램프. 테스트는 fireEvent.change로
> 5개 이상.

---

### Phase 5. 다층 검증 (Verification)

각 story 완료 후 + 전체 완료 후 모두에서 **3중 검증** 적용.

| 레이어 | 도구 | 확인 내용 |
| --- | --- | --- |
| Static | `npm run lint` (eslint), `tsc -b` | 타입 에러, react-hooks/set-state-in-effect, react-refresh/only-export-components |
| Unit / Integration | `vitest run` (56 cases) | 필터/정렬/포맷/URL/store/UI 동작 |
| Live | Playwright MCP (실제 브라우저) | 4개 viewport (1400→4cols, 1080→3cols, 700→2cols, 450→1cols), URL 하이드레이션 (`?q=jacket&pricing=0,1&sort=price_high&min=10&max=200` → 정확히 복원), 무한 스크롤 (28→48 cards, URL `?limit=48`로 갱신), 슬라이더 활성화 토글, "No items match your filters" 빈 상태 |

console error도 0건 (favicon 404 제외) 확인.

---

### Phase 6. Architect 종합 리뷰 (Read-only Review)

**목표:** 작성자가 자기 코드를 self-approve하지 않도록, **별도 read-only
agent**가 PRD acceptance criteria 한 줄씩 evidence(파일:라인)와 함께
대조.

- Subagent: `oh-my-claudecode:architect` (Opus, READ-ONLY)
- 검증 결과: **APPROVED**
- US-001 ~ US-010 모든 acceptance criterion에 PASS evidence 첨부
- 추가 발견된 minor 이슈 4건:
  1. `useColumns`의 `handleResize()` 직접 호출이 lazy 초기화와 중복 → 제거
  2. `store/filters.ts`의 `as never` 캐스트 → 타입 정정으로 제거
  3. `parseFiltersFromUrl`의 try/catch가 불필요 (URLSearchParams 생성자는 throw 안 함) → 제거
  4. `isContentItem` + `normalizeContentItem` 두 함수가 같은 shape 검사 중복 → 단일 함수로 통합

**프롬프트 예시**
> US-001~US-010의 acceptance criterion을 한 줄씩 PASS/FAIL로 판정하고
> 각 줄마다 file:line evidence를 적어. 추가로 — 이 구현이 단순히
> "맞는 답"이 아니라 **최선의 답**인지 평가하고, 더 단순/빠르/유지보수
> 좋은 대안이 있는지 적시.

---

### Phase 7. Anti-slop 정리 (Refactor Pass)

Architect가 지적한 4건을 minimal diff로 정리. 각 수정 후 즉시 56 tests
재실행하여 회귀 없음 확인.

| 수정 | 효과 |
| --- | --- |
| `useColumns` 중복 호출 제거 | StrictMode 이중 invoke로 인한 불필요 setState 제거 |
| `as never` 캐스트 제거 | 타입 안전성 향상, "왜 캐스트가 필요한가" 의문 해소 |
| `parseFiltersFromUrl` try/catch 제거 | 발생 불가능한 분기 제거 (slop 신호) |
| `normalizeContentItem` 통합 | 같은 검증을 두 번 하던 것을 한 번으로 |

번들 사이즈도 소폭 감소 (260.69 → 260.62 KB).

---

### Phase 8. 적대적 리뷰 (Adversarial Review)

별도 모델(**OpenAI Codex**)로 마지막 적대적 검토를 돌려, Claude의
판단에 동의 편향이 없었는지 교차 확인.

- 명령: `/codex:adversarial-review @README.md`
- 결과: `needs-attention` — README의 두 가지 사실 오류 지적
  1. **README 30:** `npm test` 56 cases라고 명시했지만 `docs/AI_USAGE.md`는 52 cases (집필 시점 차이로 stale)
  2. **README 20:** "CSS modules"라고 적었지만 실제로는 글로벌 CSS 파일 임포트 사용
- 두 건 모두 즉시 수정 → 56 tests 재실행 통과

**Codex가 잡은 이슈는 Claude가 자체 self-review에서는 놓친 것**이었습니다.
다른 모델 관점의 적대적 리뷰가 실제로 가치를 만들어낸 사례.

---

### Phase 9. Git 히스토리 정리 (Commit Hygiene)

평가자가 변화를 단계별로 추적할 수 있도록 9개의 기능 단위 커밋으로
정리:

```
355d411 first commit (legacy)
6f017b3 chore: ignore agent tooling artifacts
8123de6 chore(deps): add zustand, tanstack-query, and vitest stack
4a99402 feat(lib): pure filter, sort, and format helpers with tests
c80155e feat(state): URL-backed Zustand store, replacing legacy Context + sessionStorage
a3753ea feat(api): TanStack Query layer with typed errors and shape validation
1e52360 feat(ui): split filter, search, sort, slider into focused components
36228f0 feat(ui): contents list with responsive grid, infinite scroll, skeletons, empty state
1ea21e6 refactor(app): compose new shell, drop legacy refetch effect
623fcd8 docs: add AI usage record, refactor diary, and submission notes
```

각 커밋 본문에 **무엇을** 바꿨는지뿐 아니라 **왜** (어떤 레거시 결함을
해소하는지) 적시.

---

## AI를 단순 코드 생성기로 쓰지 않은 결정들

본 과제 가이드라인은 "AI 생성 코드의 취약점을 보완하고 시스템에 맞게
최적화하는 검토 및 개선 역량"을 본다고 명시했습니다. AI 출력을 그대로
받지 않고 직접 판단을 적용한 사례:

| 상황 | AI의 첫 제안 | 채택한 결정 | 이유 |
| --- | --- | --- | --- |
| URL 인코딩 | 모든 상태를 항상 URL에 직렬화 | **기본값과 다른 키만 emit** | 홈 진입 시 URL을 깨끗하게. `?q=&sort=name&min=0` 같은 노이즈 제거. |
| Slider 구현 | `react-aria` 등 라이브러리 도입 | **`<input type="range">` 두 개 스택** | 24시간 과제 범위에서는 의존성 추가가 과함. 한계는 `AI_USAGE.md`에 명시. |
| Vitest 통합 | 단일 `vite.config.ts`에 test 옵션 추가 | **`vite.config.ts` / `vitest.config.ts` 분리** | Vitest 3가 자체 번들 Vite (rolldown)를 가져와 Vite 8 plugin 타입과 충돌. 분리가 빌드를 살림. |
| 정렬 안정성 | `Array.prototype.sort()` 내장 | **그대로 사용 (브리프상 2차 정렬 무관)** | "동일 값 2차 정렬은 고려하지 않아도 됨"이라는 명시 조건. 추가 코드는 over-engineering. |
| Reset 시 displayCount | 슬라이더 변경 시 displayCount 유지 | **필터 변경 시마다 displayCount 리셋** | 필터 좁힌 뒤에도 60개가 떠있는 UX는 의도와 다름. 검색/Pricing/Slider 변경 시 28개로 복귀. |
| Slider 가격 표시 위치 | 핸들 위 popover | **양 옆 고정 텍스트 (`$10` ... `$200`)** | 디자인 참고 이미지(docs/design.png)와 일치. 모바일 터치 호환성 우선. |

---

## 알려진 한계와 후속 작업

본 과제 24시간 범위에서 의도적으로 보류한 항목 — 실제 운영 환경에서는
다음을 우선 처리할 예정.

- **가상화 미적용.** ~140 items는 메모리 그리드로 충분하나, 1만 items 이상
  스케일 시 `@tanstack/react-virtual` 또는 `react-virtuoso` 도입.
- **Slider 듀얼-핸들 UX.** 두 input이 같은 위치에 겹칠 때 드래그
  우선순위가 z-index에 종속. 픽셀 정밀 UX와 모바일 터치 타겟 키우려면
  `react-aria` `Slider` 사용.
- **E2E 자동화.** Playwright MCP로 수동 검증은 했으나 CI에 들어가는
  Playwright spec 스위트는 미작성. 후속 단계에서 critical path 4-5개
  시나리오를 자동화할 예정.
- **이미지 lazy-load 최적화.** `loading="lazy"`는 적용했지만 LCP 측정 후
  preload / blur placeholder 도입 여지가 남아 있음.

---

## 요약 한 줄

Claude Opus 4.7을 **코드 생성기가 아닌 페어 프로그래머**로 사용해, 정적
분석 → 아키텍처 설계 → PRD 계획 → TDD 구현 → 다층 검증 → architect /
Codex 이중 리뷰 → 단계별 커밋 정리까지 9단계 워크플로로 끌고 갔고, 각
단계마다 AI 출력을 그대로 받지 않고 검토/테스트/브라우저 검증을 거쳐
결정을 직접 내렸습니다.
