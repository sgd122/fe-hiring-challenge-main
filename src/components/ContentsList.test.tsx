import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ContentsList } from './ContentsList';
import { useFiltersStore } from '../store/filters';
import { DEFAULT_URL_STATE } from '../lib/url-state';
import { PricingOption } from '../types';
import type { ContentItem } from '../types';

const mockItems: ContentItem[] = Array.from({ length: 60 }).map((_, index) => ({
  id: `id-${index}`,
  creator: index % 2 === 0 ? 'Alice' : 'Bob',
  title: `Item ${index}`,
  pricingOption:
    index % 3 === 0
      ? PricingOption.PAID
      : index % 3 === 1
        ? PricingOption.FREE
        : PricingOption.VIEW_ONLY,
  imagePath: `https://example.com/${index}.jpg`,
  price: index * 10,
}));

const originalIO = globalThis.IntersectionObserver;

class FakeIntersectionObserver {
  readonly callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  observe = () => undefined;
  unobserve = () => undefined;
  disconnect = () => undefined;
  takeRecords = () => [];
  root = null;
  rootMargin = '';
  thresholds = [];
}

beforeAll(() => {
  globalThis.IntersectionObserver =
    FakeIntersectionObserver as unknown as typeof IntersectionObserver;
});

afterAll(() => {
  globalThis.IntersectionObserver = originalIO;
});

const resetStore = () => {
  useFiltersStore.setState({
    searchKeyword: DEFAULT_URL_STATE.searchKeyword,
    selectedPricingOptions: [...DEFAULT_URL_STATE.selectedPricingOptions],
    sortOption: DEFAULT_URL_STATE.sortOption,
    priceRange: [...DEFAULT_URL_STATE.priceRange] as [number, number],
    displayCount: DEFAULT_URL_STATE.displayCount,
  });
};

const createWrapper = (items: ContentItem[]) => {
  const fetchSpy = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(
      new Response(JSON.stringify(items), { status: 200, headers: { 'content-type': 'application/json' } })
    );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper, fetchSpy };
};

describe('<ContentsList />', () => {
  beforeEach(() => {
    resetStore();
    vi.restoreAllMocks();
  });

  it('renders cards based on filtered+sorted data', async () => {
    const { Wrapper } = createWrapper(mockItems);
    render(<ContentsList />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByTestId('contents-meta')).toHaveTextContent('60 items');
    });
    expect(screen.getAllByRole('article').length).toBe(DEFAULT_URL_STATE.displayCount);
  });

  it('shows no-results state when filters exclude everything', async () => {
    useFiltersStore.setState({ searchKeyword: 'totally-nonexistent-keyword' });
    const { Wrapper } = createWrapper(mockItems);
    render(<ContentsList />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText(/no items match your filters/i)).toBeInTheDocument();
    });
  });

  it('applies pricing option filter end-to-end', async () => {
    useFiltersStore.setState({ selectedPricingOptions: [PricingOption.FREE] });
    const { Wrapper } = createWrapper(mockItems);
    render(<ContentsList />, { wrapper: Wrapper });
    await waitFor(() => {
      const meta = screen.getByTestId('contents-meta').textContent ?? '';
      expect(meta).toMatch(/\d+ items/);
      expect(meta).not.toBe('Loading…');
    });
    const expectedFreeCount = mockItems.filter((i) => i.pricingOption === PricingOption.FREE).length;
    expect(screen.getByTestId('contents-meta')).toHaveTextContent(`${expectedFreeCount} items`);
  });

  it('shows error state when fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('error', { status: 500, statusText: 'Internal Server Error' })
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    render(<ContentsList />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText(/couldn't load the storefront/i)).toBeInTheDocument();
    });
  });
});
