import { useState } from 'react';
import { useStore } from '../context';
import { PricingOption } from '../types';
import type { PricingOptionValue, SortOption } from '../types';
import './Filter.css';

const FILTER_OPTIONS: { label: string; value: PricingOptionValue }[] = [
  { label: 'Paid', value: PricingOption.PAID },
  { label: 'Free', value: PricingOption.FREE },
  { label: 'View Only', value: PricingOption.VIEW_ONLY },
];

export function ContentsFilter() {
  const store = useStore();

  return (
    <section className="filter-section">
      <div className="filter-bar">
        <span className="filter-label">Pricing</span>
        <div className="filter-options">
          {FILTER_OPTIONS.map((opt, index) => (
            <label key={index} className="filter-checkbox">
              <input
                type="checkbox"
                checked={store.selectedPricingOptions.includes(opt.value)}
                onChange={() => store.togglePricingOption(opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
        <button className="reset-btn" onClick={() => store.resetFilters()}>
          Reset
        </button>
      </div>
    </section>
  );
}

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Item Name', value: 'name' },
  { label: 'Higher Price', value: 'price_high' },
  { label: 'Lower Price', value: 'price_low' },
];

export function Sorting() {
  const store = useStore();

  return (
    <div className="sorting-wrapper">
      <span className="sorting-label">Sort</span>
      <select
        className="sorting-select"
        value={store.sortOption}
        onChange={(e) => store.setSortOption(e.target.value as SortOption)}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function PricingSlider() {
  const [minVal, setMinVal] = useState(0);
  const [maxVal, setMaxVal] = useState(999);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), maxVal - 1);
    setMinVal(value);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), minVal + 1);
    setMaxVal(value);
  };

  const minPercent = (minVal / 999) * 100;
  const maxPercent = (maxVal / 999) * 100;

  return (
    <div className="slider-wrapper">
      <span className="slider-value">${minVal}</span>
      <div className="slider-container">
        <div
          className="slider-track"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />
        <input
          type="range"
          min={0}
          max={999}
          value={minVal}
          onChange={handleMinChange}
          className="slider-thumb slider-thumb-left"
        />
        <input
          type="range"
          min={0}
          max={999}
          value={maxVal}
          onChange={handleMaxChange}
          className="slider-thumb slider-thumb-right"
        />
      </div>
      <span className="slider-value">${maxVal}</span>
    </div>
  );
}
