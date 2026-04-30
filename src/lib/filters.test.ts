import { describe, it, expect } from 'vitest';
import { applyFilters, applySort, applyFiltersAndSort } from './filters';
import { PricingOption } from '../types';
import type { ContentItem } from '../types';

const items: ContentItem[] = [
  {
    id: '1',
    creator: 'Alice',
    title: 'Zenith Jacket',
    pricingOption: PricingOption.PAID,
    imagePath: 'a.jpg',
    price: 100,
  },
  {
    id: '2',
    creator: 'Bob',
    title: 'Apex Shirt',
    pricingOption: PricingOption.FREE,
    imagePath: 'b.jpg',
    price: 0,
  },
  {
    id: '3',
    creator: 'Charlie',
    title: 'Mid Hoodie',
    pricingOption: PricingOption.VIEW_ONLY,
    imagePath: 'c.jpg',
    price: 0,
  },
  {
    id: '4',
    creator: 'alice',
    title: 'Nadir Boots',
    pricingOption: PricingOption.PAID,
    imagePath: 'd.jpg',
    price: 50,
  },
  {
    id: '5',
    creator: 'Dana',
    title: 'Pinnacle Pants',
    pricingOption: PricingOption.PAID,
    imagePath: 'e.jpg',
    price: 999,
  },
];

const baseState = {
  searchKeyword: '',
  selectedPricingOptions: [],
  priceRange: [0, 999] as readonly [number, number],
};

describe('applyFilters', () => {
  it('returns all items when no filters are applied', () => {
    expect(applyFilters(items, baseState)).toHaveLength(5);
  });

  it('filters by single pricing option', () => {
    const result = applyFilters(items, {
      ...baseState,
      selectedPricingOptions: [PricingOption.FREE],
    });
    expect(result.map((i) => i.id)).toEqual(['2']);
  });

  it('filters by multiple pricing options (OR semantics)', () => {
    const result = applyFilters(items, {
      ...baseState,
      selectedPricingOptions: [PricingOption.FREE, PricingOption.VIEW_ONLY],
    });
    expect(result.map((i) => i.id).sort()).toEqual(['2', '3']);
  });

  it('keyword search matches title (case insensitive)', () => {
    const result = applyFilters(items, { ...baseState, searchKeyword: 'apex' });
    expect(result.map((i) => i.id)).toEqual(['2']);
  });

  it('keyword search matches creator (case insensitive)', () => {
    const result = applyFilters(items, { ...baseState, searchKeyword: 'ALICE' });
    expect(result.map((i) => i.id).sort()).toEqual(['1', '4']);
  });

  it('combines keyword and pricing options', () => {
    const result = applyFilters(items, {
      ...baseState,
      searchKeyword: 'alice',
      selectedPricingOptions: [PricingOption.PAID],
    });
    expect(result.map((i) => i.id).sort()).toEqual(['1', '4']);
  });

  it('does not apply price range when PAID is not selected', () => {
    const result = applyFilters(items, {
      ...baseState,
      selectedPricingOptions: [PricingOption.FREE],
      priceRange: [10, 20],
    });
    expect(result.map((i) => i.id)).toEqual(['2']);
  });

  it('applies price range only to PAID items when PAID is selected', () => {
    const result = applyFilters(items, {
      ...baseState,
      selectedPricingOptions: [PricingOption.PAID, PricingOption.FREE],
      priceRange: [40, 200],
    });
    // Free item passes (range does not apply); paid items 50, 100 pass; 999 excluded.
    expect(result.map((i) => i.id).sort()).toEqual(['1', '2', '4']);
  });

  it('price range is inclusive on both ends', () => {
    const result = applyFilters(items, {
      ...baseState,
      selectedPricingOptions: [PricingOption.PAID],
      priceRange: [50, 100],
    });
    expect(result.map((i) => i.id).sort()).toEqual(['1', '4']);
  });

  it('returns empty when no items match', () => {
    expect(
      applyFilters(items, { ...baseState, searchKeyword: 'nonexistent' })
    ).toEqual([]);
  });

  it('does not mutate input array', () => {
    const original = [...items];
    applyFilters(items, baseState);
    expect(items).toEqual(original);
  });
});

describe('applySort', () => {
  it('sorts by name ascending using localeCompare', () => {
    const result = applySort(items, 'name');
    expect(result.map((i) => i.title)).toEqual([
      'Apex Shirt',
      'Mid Hoodie',
      'Nadir Boots',
      'Pinnacle Pants',
      'Zenith Jacket',
    ]);
  });

  it('sorts by price ascending numerically (price_low)', () => {
    const result = applySort(items, 'price_low');
    expect(result.map((i) => i.price)).toEqual([0, 0, 50, 100, 999]);
  });

  it('sorts by price descending numerically (price_high)', () => {
    const result = applySort(items, 'price_high');
    expect(result.map((i) => i.price)).toEqual([999, 100, 50, 0, 0]);
  });

  it('does not mutate the input array', () => {
    const original = [...items];
    applySort(items, 'price_high');
    expect(items).toEqual(original);
  });
});

describe('applyFiltersAndSort', () => {
  it('applies sorting after filtering', () => {
    const result = applyFiltersAndSort(
      items,
      { ...baseState, selectedPricingOptions: [PricingOption.PAID] },
      'price_high'
    );
    expect(result.map((i) => i.price)).toEqual([999, 100, 50]);
  });
});
