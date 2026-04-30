import { describe, it, expect, beforeEach } from 'vitest';
import { useFiltersStore } from './filters';
import { PricingOption } from '../types';
import { DEFAULT_URL_STATE } from '../lib/url-state';

const resetStore = () => {
  useFiltersStore.setState({
    searchKeyword: DEFAULT_URL_STATE.searchKeyword,
    selectedPricingOptions: [...DEFAULT_URL_STATE.selectedPricingOptions],
    sortOption: DEFAULT_URL_STATE.sortOption,
    priceRange: [...DEFAULT_URL_STATE.priceRange] as [number, number],
    displayCount: DEFAULT_URL_STATE.displayCount,
  });
};

describe('useFiltersStore', () => {
  beforeEach(() => {
    resetStore();
  });

  it('initial state matches DEFAULT_URL_STATE for non-action fields', () => {
    const { searchKeyword, selectedPricingOptions, sortOption, priceRange, displayCount } =
      useFiltersStore.getState();
    expect({ searchKeyword, selectedPricingOptions, sortOption, priceRange, displayCount }).toEqual(
      DEFAULT_URL_STATE
    );
  });

  it('togglePricingOption adds an option that was not selected', () => {
    useFiltersStore.getState().togglePricingOption(PricingOption.PAID);
    expect(useFiltersStore.getState().selectedPricingOptions).toEqual([PricingOption.PAID]);
  });

  it('togglePricingOption removes an option that was already selected', () => {
    useFiltersStore.getState().togglePricingOption(PricingOption.PAID);
    useFiltersStore.getState().togglePricingOption(PricingOption.PAID);
    expect(useFiltersStore.getState().selectedPricingOptions).toEqual([]);
  });

  it('setSearchKeyword updates keyword and resets displayCount', () => {
    useFiltersStore.setState({ displayCount: 100 });
    useFiltersStore.getState().setSearchKeyword('hello');
    const state = useFiltersStore.getState();
    expect(state.searchKeyword).toBe('hello');
    expect(state.displayCount).toBe(DEFAULT_URL_STATE.displayCount);
  });

  it('setSortOption updates sort but does not reset displayCount', () => {
    useFiltersStore.setState({ displayCount: 80 });
    useFiltersStore.getState().setSortOption('price_high');
    const state = useFiltersStore.getState();
    expect(state.sortOption).toBe('price_high');
    expect(state.displayCount).toBe(80);
  });

  it('setPriceRange updates the price range and resets displayCount', () => {
    useFiltersStore.setState({ displayCount: 80 });
    useFiltersStore.getState().setPriceRange([10, 200]);
    const state = useFiltersStore.getState();
    expect(state.priceRange).toEqual([10, 200]);
    expect(state.displayCount).toBe(DEFAULT_URL_STATE.displayCount);
  });

  it('loadMore increments displayCount', () => {
    const before = useFiltersStore.getState().displayCount;
    useFiltersStore.getState().loadMore();
    expect(useFiltersStore.getState().displayCount).toBeGreaterThan(before);
  });

  it('resetFilters returns all fields to initial state', () => {
    const store = useFiltersStore.getState();
    store.setSearchKeyword('foo');
    store.togglePricingOption(PricingOption.FREE);
    store.setSortOption('price_low');
    store.setPriceRange([5, 50]);
    store.loadMore();
    store.resetFilters();
    const after = useFiltersStore.getState();
    expect({
      searchKeyword: after.searchKeyword,
      selectedPricingOptions: after.selectedPricingOptions,
      sortOption: after.sortOption,
      priceRange: after.priceRange,
      displayCount: after.displayCount,
    }).toEqual(DEFAULT_URL_STATE);
  });

  it('hydrateFromUrl loads state from a query string', () => {
    useFiltersStore.getState().hydrateFromUrl('?q=hello&pricing=0,1&sort=price_high&min=10&max=500&limit=60');
    const state = useFiltersStore.getState();
    expect(state.searchKeyword).toBe('hello');
    expect(state.selectedPricingOptions).toEqual([PricingOption.PAID, PricingOption.FREE]);
    expect(state.sortOption).toBe('price_high');
    expect(state.priceRange).toEqual([10, 500]);
    expect(state.displayCount).toBe(60);
  });
});
