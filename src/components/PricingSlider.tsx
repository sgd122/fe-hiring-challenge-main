import { useCallback, type ChangeEvent } from 'react';
import { useFiltersStore } from '../store/filters';
import { PricingOption } from '../types';
import { PRICE_MAX, PRICE_MIN } from '../lib/filters';
import './Filter.css';

export function PricingSlider() {
  const priceRange = useFiltersStore((s) => s.priceRange);
  const setPriceRange = useFiltersStore((s) => s.setPriceRange);
  const isPaidSelected = useFiltersStore((s) =>
    s.selectedPricingOptions.includes(PricingOption.PAID)
  );

  const [minVal, maxVal] = priceRange;

  const handleMinChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const requested = Number(event.target.value);
      const next = Math.min(requested, maxVal - 1);
      const clamped = Math.max(PRICE_MIN, next);
      setPriceRange([clamped, maxVal]);
    },
    [maxVal, setPriceRange]
  );

  const handleMaxChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const requested = Number(event.target.value);
      const next = Math.max(requested, minVal + 1);
      const clamped = Math.min(PRICE_MAX, next);
      setPriceRange([minVal, clamped]);
    },
    [minVal, setPriceRange]
  );

  const minPercent = (minVal / PRICE_MAX) * 100;
  const maxPercent = (maxVal / PRICE_MAX) * 100;

  return (
    <div
      className={`slider-wrapper${isPaidSelected ? '' : ' slider-wrapper--disabled'}`}
      aria-disabled={!isPaidSelected}
    >
      <span className="slider-value" data-testid="slider-min">
        ${minVal}
      </span>
      <div className="slider-container">
        <div
          className="slider-track"
          style={{
            left: `${minPercent}%`,
            width: `${Math.max(0, maxPercent - minPercent)}%`,
          }}
        />
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          value={minVal}
          onChange={handleMinChange}
          disabled={!isPaidSelected}
          aria-label="Minimum price"
          className="slider-thumb slider-thumb-left"
        />
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          value={maxVal}
          onChange={handleMaxChange}
          disabled={!isPaidSelected}
          aria-label="Maximum price"
          className="slider-thumb slider-thumb-right"
        />
      </div>
      <span className="slider-value" data-testid="slider-max">
        ${maxVal}
      </span>
    </div>
  );
}
