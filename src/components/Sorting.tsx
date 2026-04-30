import { useFiltersStore } from '../store/filters';
import type { SortOption } from '../types';
import './Filter.css';

const SORT_OPTIONS: ReadonlyArray<{ label: string; value: SortOption }> = [
  { label: 'Item Name (Default)', value: 'name' },
  { label: 'Higher Price', value: 'price_high' },
  { label: 'Lower Price', value: 'price_low' },
];

export function Sorting() {
  const sortOption = useFiltersStore((s) => s.sortOption);
  const setSortOption = useFiltersStore((s) => s.setSortOption);

  return (
    <div className="sorting-wrapper">
      <label className="sorting-label" htmlFor="sort-select">
        Sort
      </label>
      <select
        id="sort-select"
        className="sorting-select"
        value={sortOption}
        onChange={(e) => setSortOption(e.target.value as SortOption)}
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
