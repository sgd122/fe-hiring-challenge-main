import { useFiltersStore } from '../store/filters';
import { PricingOption } from '../types';
import type { PricingOptionValue } from '../types';
import './Filter.css';

const FILTER_OPTIONS: ReadonlyArray<{ label: string; value: PricingOptionValue }> = [
  { label: 'Paid', value: PricingOption.PAID },
  { label: 'Free', value: PricingOption.FREE },
  { label: 'View Only', value: PricingOption.VIEW_ONLY },
];

export function PricingFilter() {
  const selectedPricingOptions = useFiltersStore((s) => s.selectedPricingOptions);
  const togglePricingOption = useFiltersStore((s) => s.togglePricingOption);
  const resetFilters = useFiltersStore((s) => s.resetFilters);

  return (
    <section className="filter-section">
      <div className="filter-bar">
        <span className="filter-label">Pricing</span>
        <div className="filter-options" role="group" aria-label="Pricing option filters">
          {FILTER_OPTIONS.map((opt) => (
            <label key={opt.value} className="filter-checkbox">
              <input
                type="checkbox"
                checked={selectedPricingOptions.includes(opt.value)}
                onChange={() => togglePricingOption(opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
        <button type="button" className="reset-btn" onClick={resetFilters}>
          Reset
        </button>
      </div>
    </section>
  );
}
