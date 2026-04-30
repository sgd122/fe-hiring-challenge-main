# 리팩터링 노트 — 레거시 결함과 수정 내역

레거시 코드에서 발견한 결함과 리팩터에서 어떻게 해소했는지 요약한 감사
보고서입니다. 실제 변경 내역은 diff와, AI 활용 흐름은
`docs/AI_USAGE.md`를 함께 참고하세요.

## 아키텍처 변경 (상위 레벨)

| Before | After |
| --- | --- |
| `src/context.ts` + `src/store.tsx`로 직접 만든 React `Context` 프로바이더 | `src/store/filters.ts`의 Zustand 스토어 |
| `App.tsx`의 `useEffect(fetchContents, [searchKeyword, …])` | `['contents']` 키 1회 구성의 TanStack Query `useContents()` |
| `searchKeyword` / `pricingOptions`를 `sessionStorage`에 저장 | URL 쿼리 파라미터(`?q=…&pricing=0,1&sort=…&min=…&max=…&limit=…`)를 `parseFiltersFromUrl` / `serializeFiltersToUrl`로 양방향 처리 |
| `String(b.price).localeCompare(String(a.price))`로 정렬 | 숫자 비교(`b.price - a.price`, 오름차순도 동일 패턴) |
| `gridTemplateColumns: 'repeat(4, 1fr)'` 하드코딩 | `useColumns` 훅에서 480/768/1200 브레이크포인트로 도출 |
| `removeEventListener('resize', () => {})` (다른 함수 참조 — 정리 실패) | 안정적인 핸들러 참조 + 언마운트 시 제거 |
| 첫 렌더 시 컬럼 수 계산 부재 (resize 발생 후에만 계산) | `useColumns`가 마운트 시점부터 `window.innerWidth`로 동기 초기화 |
| 스켈레톤은 초기 페치에만 표시 | 초기 페치 + **무한 스크롤로 추가 로드 중**에도 스켈레톤 표시 |
| `displayedContents.map((item, index) => <ContentCard key={index} …/>)` | `<ContentCard key={item.id} …/>` |
| `<img …>` `alt` 없음 | `${title} by ${creator}` 형태의 설명형 alt |
| 슬라이더가 로컬 state라 필터에 연결되지 않음 | 슬라이더가 store에 양방향 바인딩, Paid 미선택 시 disabled |
| Reset은 `pricingOptions`와 `displayCount`만 초기화 | Reset이 검색어 / 정렬 / 슬라이더 / displayCount까지 **모든 URL 백킹 필드**를 기본값으로 복원 |
| "결과 없음" 뷰 부재 | `role="status"`를 가진 `EmptyState` 컴포넌트 추가 |
| `fetchContents` 에러 처리 없음 | `ContentsFetchError` 타입, 응답 status 검사, JSON 파싱 가드, 배열 검증, item-shape 검증 |

## 결함별 수정 이력

1. **검색/필터 변경 시 매번 재페칭.**
   `App.tsx`의 load effect 의존성에 `[searchKeyword, selectedPricingOptions]`이
   들어가 있어 키스트로크마다 API를 두드림. React Query 1회 호출로 교체.
2. **가격 정렬을 문자열 비교로 처리.** `Higher Price`가 실제로는 `'9'`를
   `'90'`보다 앞에 정렬. 숫자 비교로 수정.
3. **Pricing 슬라이더 미연결.** 로컬 state라 필터에 도달하지 못함. 이제
   store의 `priceRange`에 양방향 바인딩되며, Paid 미선택 시 disabled.
   핸들 역전(min > max)은 막지만, **동일 값(min === max)은 의도적으로
   허용** — README가 양 끝값 포함을 요구하므로 정확 가격 필터(예:
   `min === max === 50`)가 가능해야 함. 자세한 사후 수정은
   `docs/AI_USAGE.md` Phase 10 참조.
4. **Reset이 불완전.** 검색어, 정렬, 슬라이더, displayCount가 그대로
   유지됨. 이제 모든 URL 백킹 필드를 복원.
5. **`sessionStorage`가 "브라우저 스토리지 금지" 규칙 위반.** 제거.
   `grep -r "sessionStorage|localStorage" src/` 결과 0건.
6. **resize 리스너 메모리 누수.** `removeEventListener`가 다른 함수
   참조를 넘김. 훅이 안정적인 핸들러를 사용하도록 수정.
7. **초기 컬럼 계산 부재.** 첫 resize 이벤트 전까지 모바일에서도 4컬럼
   표시. `useColumns`가 `window.innerWidth`로 시드.
8. **React key로 `index` 사용.** 필터 변경 시 불필요 remount + 이미지
   깜빡임. 이제 `item.id` 기반.
9. **`<img>` `alt` 없음.** 접근성 결함. 추가.
10. **무한 스크롤 추가 로드 시 스켈레톤 미표시.**
    초기 수정은 `hasMore && isFetching && !showInitialSkeletons`였으나,
    TanStack Query가 클라이언트 사이드 슬라이스 확장 중에는 `isFetching`을
    `false`로 보고하므로 실제 페이지네이션 윈도우에서 스켈레톤이
    렌더되지 않음. 명시적 `isAppending` 상태와 250ms 지연 타이머로
    교체하여 IntersectionObserver가 트리거된 시점에 스켈레톤 4장이
    렌더되고, 250ms 후 `loadMore()`가 호출되며 언마운트 시 타이머를
    정리. README의 "로딩 시 Skeleton" 계약을 페이지네이션 경로까지
    충족.
11. **"결과 없음" 상태 부재.** 친절한 카피와 함께 `EmptyState` 컴포넌트
    추가.
12. **API 에러 처리.** `fetch`가 더 이상 조용히 실패하지 않음. 2xx가
    아닌 응답은 타입드 `ContentsFetchError`로 표면화되며 UI는 retry
    버튼을 노출.
13. **카드 모서리 radius 누락.** 디자인 참고 이미지(`docs/design.png`)는
    카드 wrapper(이미지 + 가격 정보) 전체가 하나의 둥근 모서리이고
    이미지 좌우 하단은 직각이지만, `.content-card` / `.skeleton-card`에
    `border-radius`가 없어 카드 전체가 직각으로 렌더링됨. 두 wrapper
    클래스에만 `border-radius: 4px`를 적용 — 기존 `overflow: hidden`이
    이미지 상단 두 모서리를 자연스럽게 클립하여 카드 상단은 둥글고,
    이미지 하단은 직각, 가격 정보가 카드 하단 둥근 모서리를 형성.
    이미지 자체에는 radius를 주지 않아 디자인 의도(이미지 좌우 하단
    직각)와 일치. AI_USAGE.md Phase 12 참조.

## 주목할 추가 사항

- `parseFiltersFromUrl`은 방어적: 잘못된 pricing 값은 drop, 범위 밖 가격은
  clamp, `min` / `max` 역전은 swap, `limit`은 기본값으로 floor.
- `serializeFiltersToUrl`은 기본값과 다른 키만 emit — 홈 진입 시 URL을
  깨끗하게 유지.
- TanStack Query 클라이언트는 `retry: 2`와 5분 staleTime으로 구성 —
  필터 변경이 재페칭을 트리거하지 않고 캐시된 `ContentItem[]`에서 view를
  derive.

## 테스트

`npm test` — **61 케이스, 7 파일 전체 그린**:

- `src/lib/filters.test.ts` — 16 케이스 (필터 조합, 정렬 숫자, 불변성)
- `src/lib/url-state.test.ts` — 14 케이스 (parse, 기본값, clamp, 라운드트립)
- `src/lib/format.test.ts` — 4 케이스 (가격 라벨 포맷)
- `src/store/filters.test.ts` — 11 케이스 (스토어 액션, reset, 하이드레이션,
  `startUrlSync` URL 미러 + popstate 복원)
- `src/components/PricingFilter.test.tsx` — 3 케이스 (UI 동작, reset)
- `src/components/PricingSlider.test.tsx` — 7 케이스 (disabled, 역전 방지,
  양 끝값 포함, store 동기화)
- `src/components/ContentsList.test.tsx` — 6 케이스 (렌더, idle-no-skeleton,
  append-skeleton, no-result, filter, error)
