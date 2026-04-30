import { PricingOption } from '../types';
import type { ContentItem } from '../types';

export const formatPriceLabel = (item: ContentItem): string => {
  if (item.pricingOption === PricingOption.FREE) return 'FREE';
  if (item.pricingOption === PricingOption.VIEW_ONLY) return 'View Only';
  return `$${item.price.toFixed(2)}`;
};
