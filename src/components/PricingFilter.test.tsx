import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PricingFilter } from './PricingFilter';
import { useFiltersStore } from '../store/filters';
import { DEFAULT_URL_STATE } from '../lib/url-state';
import { PricingOption } from '../types';

const resetStore = () => {
  useFiltersStore.setState({
    searchKeyword: DEFAULT_URL_STATE.searchKeyword,
    selectedPricingOptions: [...DEFAULT_URL_STATE.selectedPricingOptions],
    sortOption: DEFAULT_URL_STATE.sortOption,
    priceRange: [...DEFAULT_URL_STATE.priceRange] as [number, number],
    displayCount: DEFAULT_URL_STATE.displayCount,
  });
};

describe('<PricingFilter />', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders the three pricing options', () => {
    render(<PricingFilter />);
    expect(screen.getByLabelText('Paid')).toBeInTheDocument();
    expect(screen.getByLabelText('Free')).toBeInTheDocument();
    expect(screen.getByLabelText('View Only')).toBeInTheDocument();
  });

  it('toggles a pricing option in the store on click', async () => {
    const user = userEvent.setup();
    render(<PricingFilter />);
    await user.click(screen.getByLabelText('Paid'));
    expect(useFiltersStore.getState().selectedPricingOptions).toEqual([PricingOption.PAID]);
    await user.click(screen.getByLabelText('Paid'));
    expect(useFiltersStore.getState().selectedPricingOptions).toEqual([]);
  });

  it('Reset button restores all filters to default state', async () => {
    const user = userEvent.setup();
    useFiltersStore.setState({
      searchKeyword: 'something',
      selectedPricingOptions: [PricingOption.PAID, PricingOption.FREE],
      sortOption: 'price_high',
      priceRange: [50, 200],
      displayCount: 100,
    });
    render(<PricingFilter />);
    await user.click(screen.getByRole('button', { name: /reset/i }));
    const state = useFiltersStore.getState();
    expect({
      searchKeyword: state.searchKeyword,
      selectedPricingOptions: state.selectedPricingOptions,
      sortOption: state.sortOption,
      priceRange: state.priceRange,
      displayCount: state.displayCount,
    }).toEqual(DEFAULT_URL_STATE);
  });
});
