export const PricingOption = {
  PAID: 0,
  FREE: 1,
  VIEW_ONLY: 2,
} as const;

export type PricingOptionValue = (typeof PricingOption)[keyof typeof PricingOption];

export interface ContentItem {
  id: string;
  creator: string;
  title: string;
  pricingOption: PricingOptionValue;
  imagePath: string;
  price: number;
}

export type SortOption = 'name' | 'price_high' | 'price_low';
