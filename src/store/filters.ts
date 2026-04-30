import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { PricingOptionValue, SortOption } from '../types';
import {
  DEFAULT_URL_STATE,
  LOAD_MORE_INCREMENT,
  parseFiltersFromUrl,
  serializeFiltersToUrl,
  type UrlState,
} from '../lib/url-state';

export interface FiltersState extends UrlState {
  setSearchKeyword: (keyword: string) => void;
  togglePricingOption: (option: PricingOptionValue) => void;
  setPricingOptions: (options: PricingOptionValue[]) => void;
  setSortOption: (option: SortOption) => void;
  setPriceRange: (range: [number, number]) => void;
  loadMore: () => void;
  resetFilters: () => void;
  hydrateFromUrl: (search: string) => void;
}

const initialUrlState =
  typeof window !== 'undefined'
    ? parseFiltersFromUrl(window.location.search)
    : { ...DEFAULT_URL_STATE };

export const useFiltersStore = create<FiltersState>()(
  subscribeWithSelector((set, get) => ({
    ...initialUrlState,

    setSearchKeyword: (keyword) => {
      set({
        searchKeyword: keyword,
        displayCount: DEFAULT_URL_STATE.displayCount,
      });
    },

    togglePricingOption: (option) => {
      const current = get().selectedPricingOptions;
      const next = current.includes(option)
        ? current.filter((value) => value !== option)
        : [...current, option];
      set({
        selectedPricingOptions: next,
        displayCount: DEFAULT_URL_STATE.displayCount,
      });
    },

    setPricingOptions: (options) =>
      set({
        selectedPricingOptions: options,
        displayCount: DEFAULT_URL_STATE.displayCount,
      }),

    setSortOption: (option) => set({ sortOption: option }),

    setPriceRange: (range) =>
      set({
        priceRange: range,
        displayCount: DEFAULT_URL_STATE.displayCount,
      }),

    loadMore: () =>
      set((state) => ({
        displayCount: state.displayCount + LOAD_MORE_INCREMENT,
      })),

    resetFilters: () =>
      set({
        searchKeyword: DEFAULT_URL_STATE.searchKeyword,
        selectedPricingOptions: [...DEFAULT_URL_STATE.selectedPricingOptions],
        sortOption: DEFAULT_URL_STATE.sortOption,
        priceRange: [...DEFAULT_URL_STATE.priceRange] as [number, number],
        displayCount: DEFAULT_URL_STATE.displayCount,
      }),

    hydrateFromUrl: (search) => {
      const next = parseFiltersFromUrl(search);
      set(next);
    },
  }))
);

const pickUrlState = (state: FiltersState): UrlState => ({
  searchKeyword: state.searchKeyword,
  selectedPricingOptions: state.selectedPricingOptions,
  sortOption: state.sortOption,
  priceRange: state.priceRange,
  displayCount: state.displayCount,
});

const urlStateEqual = (a: UrlState, b: UrlState): boolean =>
  a.searchKeyword === b.searchKeyword &&
  a.sortOption === b.sortOption &&
  a.priceRange[0] === b.priceRange[0] &&
  a.priceRange[1] === b.priceRange[1] &&
  a.displayCount === b.displayCount &&
  a.selectedPricingOptions.length === b.selectedPricingOptions.length &&
  a.selectedPricingOptions.every((value, index) => value === b.selectedPricingOptions[index]);

export const startUrlSync = (): (() => void) => {
  if (typeof window === 'undefined') return () => undefined;

  const writeUrl = (slice: UrlState) => {
    const search = serializeFiltersToUrl(slice);
    const target = `${window.location.pathname}${search}${window.location.hash}`;
    const current = window.location.pathname + window.location.search + window.location.hash;
    if (target !== current) {
      window.history.replaceState(null, '', target);
    }
  };

  const unsubscribe = useFiltersStore.subscribe(pickUrlState, writeUrl, {
    equalityFn: urlStateEqual,
  });

  const onPopState = () => {
    useFiltersStore.getState().hydrateFromUrl(window.location.search);
  };
  window.addEventListener('popstate', onPopState);

  return () => {
    unsubscribe();
    window.removeEventListener('popstate', onPopState);
  };
};
