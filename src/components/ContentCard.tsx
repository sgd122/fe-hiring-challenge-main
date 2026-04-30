import { useMemo } from 'react';
import { PricingOption } from '../types';
import type { ContentItem } from '../types';
import { formatPriceLabel } from '../lib/format';
import './Content.css';

interface ContentCardProps {
  item: ContentItem;
}

export function ContentCard({ item }: ContentCardProps) {
  const priceLabel = useMemo(() => formatPriceLabel(item), [item]);
  const isFree = item.pricingOption === PricingOption.FREE;

  return (
    <article className="content-card">
      <div className="card-image-wrapper">
        <img
          src={item.imagePath}
          alt={`${item.title} by ${item.creator}`}
          className="card-image"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="card-info">
        <div className="card-info-text">
          <div className="card-title" title={item.title}>
            {item.title}
          </div>
          <div className="card-creator">{item.creator}</div>
        </div>
        <div
          className={`card-price${isFree ? ' card-price--free' : ''}`}
          aria-label={`Price ${priceLabel}`}
        >
          {priceLabel}
        </div>
      </div>
    </article>
  );
}
