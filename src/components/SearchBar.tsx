import { useCallback, useId, type ChangeEvent } from 'react';
import styled from '@emotion/styled';
import { useFiltersStore } from '../store/filters';

const SearchWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 76px;
  padding: 0 24px;
  margin-bottom: 18px;
  border: 1px solid rgba(121, 236, 206, 0.1);
  border-radius: 12px;
  background: rgba(23, 25, 29, 0.94);
`;

const SearchInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: #e7ecef;
  font-size: 15px;
  padding: 18px 0;
  outline: none;

  &::placeholder {
    color: #6a7077;
  }
`;

const SearchMeta = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #7ee8cd;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
`;

const SearchIcon = styled.span`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e7ecef;
  font-size: 15px;
  border: 1px solid rgba(121, 236, 206, 0.18);
  border-radius: 999px;
`;

export function SearchBar() {
  const inputId = useId();
  const searchKeyword = useFiltersStore((s) => s.searchKeyword);
  const setSearchKeyword = useFiltersStore((s) => s.setSearchKeyword);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSearchKeyword(event.target.value);
    },
    [setSearchKeyword]
  );

  return (
    <SearchWrapper>
      <SearchInput
        id={inputId}
        type="text"
        placeholder="Find the items you're looking for"
        value={searchKeyword}
        onChange={handleChange}
        aria-label="Keyword search"
      />
      <SearchMeta htmlFor={inputId}>
        <span>Keyword search</span>
        <SearchIcon aria-hidden="true">⌕</SearchIcon>
      </SearchMeta>
    </SearchWrapper>
  );
}
