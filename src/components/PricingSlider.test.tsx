import { describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PricingSlider } from './PricingSlider';
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

describe('<PricingSlider />', () => {
  beforeEach(() => {
    resetStore();
  });

  it('is disabled when PAID is not in the selected pricing options', () => {
    render(<PricingSlider />);
    expect(screen.getByLabelText('Minimum price')).toBeDisabled();
    expect(screen.getByLabelText('Maximum price')).toBeDisabled();
  });

  it('enables when PAID is selected', () => {
    useFiltersStore.setState({ selectedPricingOptions: [PricingOption.PAID] });
    render(<PricingSlider />);
    expect(screen.getByLabelText('Minimum price')).not.toBeDisabled();
    expect(screen.getByLabelText('Maximum price')).not.toBeDisabled();
  });

  it('updates the store priceRange on change', () => {
    useFiltersStore.setState({ selectedPricingOptions: [PricingOption.PAID] });
    render(<PricingSlider />);
    fireEvent.change(screen.getByLabelText('Minimum price'), { target: { value: '100' } });
    expect(useFiltersStore.getState().priceRange[0]).toBe(100);
    fireEvent.change(screen.getByLabelText('Maximum price'), { target: { value: '500' } });
    expect(useFiltersStore.getState().priceRange[1]).toBe(500);
  });

  it('prevents min handle from crossing max handle', () => {
    useFiltersStore.setState({
      selectedPricingOptions: [PricingOption.PAID],
      priceRange: [50, 100],
    });
    render(<PricingSlider />);
    fireEvent.change(screen.getByLabelText('Minimum price'), { target: { value: '500' } });
    expect(useFiltersStore.getState().priceRange[0]).toBe(100); // capped at max
  });

  it('prevents max handle from crossing min handle', () => {
    useFiltersStore.setState({
      selectedPricingOptions: [PricingOption.PAID],
      priceRange: [50, 100],
    });
    render(<PricingSlider />);
    fireEvent.change(screen.getByLabelText('Maximum price'), { target: { value: '10' } });
    expect(useFiltersStore.getState().priceRange[1]).toBe(50); // capped at min
  });

  it('allows selecting a single inclusive price point when handles meet', () => {
    useFiltersStore.setState({
      selectedPricingOptions: [PricingOption.PAID],
      priceRange: [50, 100],
    });
    render(<PricingSlider />);
    fireEvent.change(screen.getByLabelText('Minimum price'), { target: { value: '100' } });
    expect(useFiltersStore.getState().priceRange).toEqual([100, 100]);

    fireEvent.change(screen.getByLabelText('Maximum price'), { target: { value: '100' } });
    expect(useFiltersStore.getState().priceRange).toEqual([100, 100]);
  });

  it('displays the current min and max values', () => {
    useFiltersStore.setState({
      selectedPricingOptions: [PricingOption.PAID],
      priceRange: [25, 750],
    });
    render(<PricingSlider />);
    expect(screen.getByTestId('slider-min')).toHaveTextContent('$25');
    expect(screen.getByTestId('slider-max')).toHaveTextContent('$750');
  });
});
