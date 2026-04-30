import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../context';
import { PricingOption } from '../types';
import type { ContentItem } from '../types';
import './Content.css';

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-image skeleton-pulse" />
      <div className="skeleton-info">
        <div className="skeleton-line skeleton-pulse" style={{ width: '70%' }} />
        <div className="skeleton-line skeleton-pulse" style={{ width: '40%' }} />
      </div>
    </div>
  );
}

interface ContentCardProps {
  item: ContentItem;
}

export function ContentCard({ item }: ContentCardProps) {
  const priceLabel = useMemo(() => {
    if (item.pricingOption === PricingOption.FREE) return 'FREE';
    if (item.pricingOption === PricingOption.VIEW_ONLY) return 'View Only';
    return `$${item.price.toFixed(2)}`;
  }, [item.pricingOption, item.price]);

  return (
    <div className="content-card">
      <div className="card-image-wrapper">
        <img
          src={item.imagePath}
          className="card-image"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>
      <div
        className="card-info"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}
      >
        <div>
          <div className="card-title" style={{ color: '#e0e0e0' }}>
            {item.title}
          </div>
          <div className="card-creator">{item.creator}</div>
        </div>
        <div
          className="card-price"
          style={{
            color: item.pricingOption === PricingOption.FREE ? '#79ecce' : '#ffffff',
            fontWeight: 700,
          }}
        >
          {priceLabel}
        </div>
      </div>
    </div>
  );
}

export function ContentsList() {
  const store = useStore();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [, setWindowWidth] = useState(window.innerWidth);
  const [filteredCount, setFilteredCount] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);

      const width = window.innerWidth;
      if (width <= 480) store.setColumns(1);
      else if (width <= 768) store.setColumns(2);
      else if (width <= 1200) store.setColumns(3);
      else store.setColumns(4);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', () => {});
    };
  }, []);

  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !store.isLoading) {
          store.loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
  }, [store.isLoading]);

  const filteredContents = store.contents
    .filter((item) => {
      if (store.selectedPricingOptions.length > 0) {
        if (!store.selectedPricingOptions.includes(item.pricingOption)) return false;
      }

      if (store.searchKeyword) {
        const keyword = store.searchKeyword.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(keyword);
        const matchCreator = item.creator.toLowerCase().includes(keyword);
        if (!matchTitle && !matchCreator) return false;
      }

      if (
        store.selectedPricingOptions.includes(PricingOption.PAID) &&
        item.pricingOption === PricingOption.PAID
      ) {
        if (item.price < store.priceRange[0] || item.price > store.priceRange[1]) return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (store.sortOption) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'price_high':
          return String(b.price).localeCompare(String(a.price));
        case 'price_low':
          return String(a.price).localeCompare(String(b.price));
        default:
          return 0;
      }
    });

  const displayedContents = filteredContents.slice(0, store.displayCount);
  const hasMore = filteredContents.length > store.displayCount;

  useEffect(() => {
    setFilteredCount(filteredContents.length);
  }, [filteredContents]);

  return (
    <section className="contents-section">
      <div className="contents-header">
        <div className="contents-kicker">Store selection</div>
        <div className="contents-meta">{filteredCount} items</div>
      </div>
      <div className="contents-grid" style={{ gridTemplateColumns: `repeat(4, 1fr)` }}>
        {store.isLoading
          ? Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={index} />)
          : displayedContents.map((item, index) => <ContentCard key={index} item={item} />)}
      </div>
      {hasMore && (
        <div ref={loadMoreRef} className="load-more-trigger">
          <div className="loading-spinner" />
        </div>
      )}
    </section>
  );
}
