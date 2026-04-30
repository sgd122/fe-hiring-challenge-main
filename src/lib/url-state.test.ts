import { describe, it, expect } from 'vitest';
import {
  DEFAULT_DISPLAY_COUNT,
  DEFAULT_URL_STATE,
  parseFiltersFromUrl,
  serializeFiltersToUrl,
} from './url-state';
import { PricingOption } from '../types';

describe('parseFiltersFromUrl', () => {
  it('returns defaults for an empty string', () => {
    expect(parseFiltersFromUrl('')).toEqual(DEFAULT_URL_STATE);
  });

  it('parses keyword from q param', () => {
    expect(parseFiltersFromUrl('?q=hello').searchKeyword).toBe('hello');
  });

  it('parses pricing options as csv of valid ints', () => {
    const result = parseFiltersFromUrl('?pricing=0,1,2');
    expect(result.selectedPricingOptions).toEqual([
      PricingOption.PAID,
      PricingOption.FREE,
      PricingOption.VIEW_ONLY,
    ]);
  });

  it('drops invalid pricing values silently', () => {
    const result = parseFiltersFromUrl('?pricing=0,abc,9,1');
    expect(result.selectedPricingOptions).toEqual([
      PricingOption.PAID,
      PricingOption.FREE,
    ]);
  });

  it('falls back to default sort for unknown values', () => {
    expect(parseFiltersFromUrl('?sort=invalid').sortOption).toBe('name');
  });

  it('parses valid sort options', () => {
    expect(parseFiltersFromUrl('?sort=price_high').sortOption).toBe('price_high');
    expect(parseFiltersFromUrl('?sort=price_low').sortOption).toBe('price_low');
  });

  it('clamps price range to [0, 999] and swaps reversed order', () => {
    const result = parseFiltersFromUrl('?min=900&max=10');
    expect(result.priceRange).toEqual([10, 900]);
  });

  it('clamps out-of-bounds price', () => {
    expect(parseFiltersFromUrl('?min=-100&max=5000').priceRange).toEqual([0, 999]);
  });

  it('parses display count and respects minimum default floor', () => {
    expect(parseFiltersFromUrl('?limit=80').displayCount).toBe(80);
    expect(parseFiltersFromUrl('?limit=4').displayCount).toBe(DEFAULT_DISPLAY_COUNT);
  });

  it('handles malformed query string gracefully', () => {
    const result = parseFiltersFromUrl('?q=&pricing=&sort=&min=&max=&limit=');
    expect(result).toEqual(DEFAULT_URL_STATE);
  });
});

describe('serializeFiltersToUrl', () => {
  it('produces an empty string when state is the default', () => {
    expect(serializeFiltersToUrl(DEFAULT_URL_STATE)).toBe('');
  });

  it('emits only non-default keys', () => {
    const out = serializeFiltersToUrl({
      ...DEFAULT_URL_STATE,
      searchKeyword: 'jacket',
      selectedPricingOptions: [PricingOption.PAID],
    });
    expect(out).toBe('?q=jacket&pricing=0');
  });

  it('roundtrips a fully populated state', () => {
    const state = {
      searchKeyword: 'shirt',
      selectedPricingOptions: [PricingOption.PAID, PricingOption.VIEW_ONLY],
      sortOption: 'price_high' as const,
      priceRange: [10, 500] as [number, number],
      displayCount: 60,
    };
    const serialized = serializeFiltersToUrl(state);
    expect(parseFiltersFromUrl(serialized)).toEqual(state);
  });

  it('encodes special characters in keyword safely', () => {
    const state = { ...DEFAULT_URL_STATE, searchKeyword: 'hello world & friends' };
    const serialized = serializeFiltersToUrl(state);
    expect(parseFiltersFromUrl(serialized).searchKeyword).toBe(
      'hello world & friends'
    );
  });
});
