import { PricingOption } from '../types';
import type { PricingOptionValue, SortOption } from '../types';
import { PRICE_MAX, PRICE_MIN } from './filters';

export const DEFAULT_DISPLAY_COUNT = 28;
export const LOAD_MORE_INCREMENT = 20;

export interface UrlState {
  searchKeyword: string;
  selectedPricingOptions: PricingOptionValue[];
  sortOption: SortOption;
  priceRange: [number, number];
  displayCount: number;
}

export const DEFAULT_URL_STATE: UrlState = {
  searchKeyword: '',
  selectedPricingOptions: [],
  sortOption: 'name',
  priceRange: [PRICE_MIN, PRICE_MAX],
  displayCount: DEFAULT_DISPLAY_COUNT,
};

const VALID_PRICING: ReadonlySet<number> = new Set([
  PricingOption.PAID,
  PricingOption.FREE,
  PricingOption.VIEW_ONLY,
]);

const VALID_SORTS: ReadonlySet<SortOption> = new Set<SortOption>([
  'name',
  'price_high',
  'price_low',
]);

const clampInt = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.trunc(value)));
};

const parsePricing = (raw: string | null): PricingOptionValue[] => {
  if (!raw) return [];
  const parts = raw
    .split(',')
    .map((part) => Number.parseInt(part, 10))
    .filter((value) => VALID_PRICING.has(value)) as PricingOptionValue[];
  // De-duplicate while preserving order.
  return Array.from(new Set(parts));
};

const parseSort = (raw: string | null): SortOption => {
  if (raw && VALID_SORTS.has(raw as SortOption)) return raw as SortOption;
  return DEFAULT_URL_STATE.sortOption;
};

const parseIntOrNull = (raw: string | null): number | null => {
  if (raw === null || raw.length === 0) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const parsePrice = (rawMin: string | null, rawMax: string | null): [number, number] => {
  const parsedMin = parseIntOrNull(rawMin);
  const parsedMax = parseIntOrNull(rawMax);
  let min = parsedMin === null ? PRICE_MIN : clampInt(parsedMin, PRICE_MIN, PRICE_MAX);
  let max = parsedMax === null ? PRICE_MAX : clampInt(parsedMax, PRICE_MIN, PRICE_MAX);
  if (min > max) {
    [min, max] = [max, min];
  }
  return [min, max];
};

const parseDisplayCount = (raw: string | null): number => {
  const parsed = parseIntOrNull(raw);
  if (parsed === null || parsed <= 0) return DEFAULT_DISPLAY_COUNT;
  return Math.max(DEFAULT_DISPLAY_COUNT, parsed);
};

export const parseFiltersFromUrl = (search: string): UrlState => {
  const params = new URLSearchParams(search);
  return {
    searchKeyword: (params.get('q') ?? '').slice(0, 200),
    selectedPricingOptions: parsePricing(params.get('pricing')),
    sortOption: parseSort(params.get('sort')),
    priceRange: parsePrice(params.get('min'), params.get('max')),
    displayCount: parseDisplayCount(params.get('limit')),
  };
};

export const serializeFiltersToUrl = (state: UrlState): string => {
  const params = new URLSearchParams();
  if (state.searchKeyword) params.set('q', state.searchKeyword);
  if (state.selectedPricingOptions.length > 0) {
    params.set('pricing', state.selectedPricingOptions.join(','));
  }
  if (state.sortOption !== DEFAULT_URL_STATE.sortOption) {
    params.set('sort', state.sortOption);
  }
  if (state.priceRange[0] !== PRICE_MIN) {
    params.set('min', String(state.priceRange[0]));
  }
  if (state.priceRange[1] !== PRICE_MAX) {
    params.set('max', String(state.priceRange[1]));
  }
  if (state.displayCount !== DEFAULT_DISPLAY_COUNT) {
    params.set('limit', String(state.displayCount));
  }
  const out = params.toString();
  return out.length > 0 ? `?${out}` : '';
};
