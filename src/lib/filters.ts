import { PricingOption } from '../types';
import type { ContentItem, PricingOptionValue, SortOption } from '../types';

export interface FilterState {
  searchKeyword: string;
  selectedPricingOptions: readonly PricingOptionValue[];
  priceRange: readonly [number, number];
}

export const PRICE_MIN = 0;
export const PRICE_MAX = 999;

const matchesPricingOptions = (
  item: ContentItem,
  selectedPricingOptions: readonly PricingOptionValue[]
): boolean => {
  if (selectedPricingOptions.length === 0) return true;
  return selectedPricingOptions.includes(item.pricingOption);
};

const matchesKeyword = (item: ContentItem, keyword: string): boolean => {
  const trimmed = keyword.trim().toLowerCase();
  if (trimmed.length === 0) return true;
  return (
    item.title.toLowerCase().includes(trimmed) ||
    item.creator.toLowerCase().includes(trimmed)
  );
};

const matchesPriceRange = (
  item: ContentItem,
  selectedPricingOptions: readonly PricingOptionValue[],
  priceRange: readonly [number, number]
): boolean => {
  const isPaidActive = selectedPricingOptions.includes(PricingOption.PAID);
  if (!isPaidActive) return true;
  if (item.pricingOption !== PricingOption.PAID) return true;
  const [min, max] = priceRange;
  return item.price >= min && item.price <= max;
};

export const applyFilters = (
  items: readonly ContentItem[],
  state: FilterState
): ContentItem[] =>
  items.filter(
    (item) =>
      matchesPricingOptions(item, state.selectedPricingOptions) &&
      matchesKeyword(item, state.searchKeyword) &&
      matchesPriceRange(item, state.selectedPricingOptions, state.priceRange)
  );

export const applySort = (
  items: readonly ContentItem[],
  sort: SortOption
): ContentItem[] => {
  const copy = [...items];
  switch (sort) {
    case 'name':
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case 'price_high':
      return copy.sort((a, b) => b.price - a.price);
    case 'price_low':
      return copy.sort((a, b) => a.price - b.price);
    default:
      return copy;
  }
};

export const applyFiltersAndSort = (
  items: readonly ContentItem[],
  state: FilterState,
  sort: SortOption
): ContentItem[] => applySort(applyFilters(items, state), sort);
