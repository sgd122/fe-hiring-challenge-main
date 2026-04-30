import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useContents } from '../api/contents';
import { useFiltersStore } from '../store/filters';
import { useColumns } from '../hooks/useColumns';
import { applyFiltersAndSort } from '../lib/filters';
import { ContentCard } from './ContentCard';
import { SkeletonCard } from './SkeletonCard';
import { EmptyState } from './EmptyState';
import './Content.css';

const INITIAL_SKELETON_COUNT = 8;
const APPEND_SKELETON_COUNT = 4;
const APPEND_LOADING_DELAY_MS = 250;

export function ContentsList() {
  const { data, isLoading, isFetching, error, refetch } = useContents();
  const searchKeyword = useFiltersStore((s) => s.searchKeyword);
  const selectedPricingOptions = useFiltersStore((s) => s.selectedPricingOptions);
  const sortOption = useFiltersStore((s) => s.sortOption);
  const priceRange = useFiltersStore((s) => s.priceRange);
  const displayCount = useFiltersStore((s) => s.displayCount);
  const loadMore = useFiltersStore((s) => s.loadMore);

  const columns = useColumns();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const appendTimerRef = useRef<number | null>(null);
  const [isAppending, setIsAppending] = useState(false);

  const filteredContents = useMemo(() => {
    if (!data) return [];
    return applyFiltersAndSort(
      data,
      { searchKeyword, selectedPricingOptions, priceRange },
      sortOption
    );
  }, [data, searchKeyword, selectedPricingOptions, priceRange, sortOption]);

  const displayedContents = useMemo(
    () => filteredContents.slice(0, displayCount),
    [filteredContents, displayCount]
  );

  const hasMore = displayedContents.length < filteredContents.length;

  const clearAppendTimer = useCallback(() => {
    if (appendTimerRef.current === null) return;
    window.clearTimeout(appendTimerRef.current);
    appendTimerRef.current = null;
  }, []);

  const startAppendLoad = useCallback(() => {
    if (!hasMore || appendTimerRef.current !== null) return;

    setIsAppending(true);
    appendTimerRef.current = window.setTimeout(() => {
      appendTimerRef.current = null;
      loadMore();
      setIsAppending(false);
    }, APPEND_LOADING_DELAY_MS);
  }, [hasMore, loadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          startAppendLoad();
        }
      },
      { threshold: 0.1, rootMargin: '120px' }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, startAppendLoad]);

  useEffect(() => {
    return () => {
      clearAppendTimer();
    };
  }, [clearAppendTimer]);

  if (error) {
    return (
      <section className="contents-section">
        <EmptyState
          title="We couldn't load the storefront"
          description={
            error instanceof Error
              ? `${error.message} — please try again.`
              : 'An unknown error occurred. Please try again.'
          }
        />
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <button type="button" className="reset-btn" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      </section>
    );
  }

  const showInitialSkeletons = isLoading || (!data && isFetching);
  const showAppendSkeletons = hasMore && isAppending && !showInitialSkeletons;

  return (
    <section className="contents-section">
      <div className="contents-header">
        <div className="contents-kicker">Store selection</div>
        <div className="contents-meta" data-testid="contents-meta">
          {showInitialSkeletons ? 'Loading…' : `${filteredContents.length} items`}
        </div>
      </div>

      {!showInitialSkeletons && filteredContents.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          className="contents-grid"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          data-testid="contents-grid"
        >
          {showInitialSkeletons
            ? Array.from({ length: INITIAL_SKELETON_COUNT }).map((_, index) => (
                <SkeletonCard key={`initial-skeleton-${index}`} />
              ))
            : displayedContents.map((item) => <ContentCard key={item.id} item={item} />)}
          {showAppendSkeletons
            ? Array.from({ length: APPEND_SKELETON_COUNT }).map((_, index) => (
                <SkeletonCard key={`append-skeleton-${index}`} />
              ))
            : null}
        </div>
      )}

      {hasMore ? (
        <div ref={sentinelRef} className="load-more-trigger" aria-hidden="true">
          <div className="loading-spinner" />
        </div>
      ) : null}
    </section>
  );
}
