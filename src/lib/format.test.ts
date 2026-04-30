import { describe, it, expect } from 'vitest';
import { formatPriceLabel } from './format';
import { PricingOption } from '../types';
import type { ContentItem } from '../types';

const base: ContentItem = {
  id: '1',
  creator: 'Alice',
  title: 'Item',
  imagePath: 'a.jpg',
  pricingOption: PricingOption.PAID,
  price: 12.5,
};

describe('formatPriceLabel', () => {
  it('formats paid items with two decimals and dollar sign', () => {
    expect(formatPriceLabel({ ...base, pricingOption: PricingOption.PAID, price: 12.5 })).toBe(
      '$12.50'
    );
  });

  it('returns FREE for free items', () => {
    expect(formatPriceLabel({ ...base, pricingOption: PricingOption.FREE })).toBe('FREE');
  });

  it('returns View Only for view-only items', () => {
    expect(formatPriceLabel({ ...base, pricingOption: PricingOption.VIEW_ONLY })).toBe(
      'View Only'
    );
  });

  it('formats integer prices with two decimals', () => {
    expect(formatPriceLabel({ ...base, price: 99 })).toBe('$99.00');
  });
});
