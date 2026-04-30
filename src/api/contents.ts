import { useQuery } from '@tanstack/react-query';
import { PricingOption } from '../types';
import type { ContentItem, PricingOptionValue } from '../types';

const API_URL = 'https://closet-recruiting-api.azurewebsites.net/api/data';

export class ContentsFetchError extends Error {
  readonly status: number | undefined;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ContentsFetchError';
    this.status = status;
  }
}

const VALID_PRICING_VALUES: ReadonlySet<number> = new Set([
  PricingOption.PAID,
  PricingOption.FREE,
  PricingOption.VIEW_ONLY,
]);

const normalizeContentItem = (raw: unknown): ContentItem | null => {
  if (raw === null || typeof raw !== 'object') return null;
  const candidate = raw as Record<string, unknown>;
  if (
    typeof candidate.id === 'undefined' ||
    typeof candidate.creator !== 'string' ||
    typeof candidate.title !== 'string' ||
    typeof candidate.imagePath !== 'string' ||
    typeof candidate.price !== 'number' ||
    typeof candidate.pricingOption !== 'number' ||
    !VALID_PRICING_VALUES.has(candidate.pricingOption)
  ) {
    return null;
  }
  return {
    id: String(candidate.id),
    creator: candidate.creator,
    title: candidate.title,
    imagePath: candidate.imagePath,
    price: candidate.price,
    pricingOption: candidate.pricingOption as PricingOptionValue,
  };
};

export const fetchContents = async (signal?: AbortSignal): Promise<ContentItem[]> => {
  let response: Response;
  try {
    response = await fetch(API_URL, { signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ContentsFetchError(
      error instanceof Error ? error.message : 'Network error fetching contents'
    );
  }

  if (!response.ok) {
    throw new ContentsFetchError(
      `Failed to fetch contents: ${response.status} ${response.statusText}`,
      response.status
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ContentsFetchError('Failed to parse contents response as JSON');
  }

  if (!Array.isArray(body)) {
    throw new ContentsFetchError('Contents response is not an array');
  }

  return body.reduce<ContentItem[]>((acc, raw) => {
    const item = normalizeContentItem(raw);
    if (item !== null) acc.push(item);
    return acc;
  }, []);
};

export const CONTENTS_QUERY_KEY = ['contents'] as const;

export const useContents = () =>
  useQuery({
    queryKey: CONTENTS_QUERY_KEY,
    queryFn: ({ signal }) => fetchContents(signal),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
