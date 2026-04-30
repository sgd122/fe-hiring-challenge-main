import { useCallback } from 'react';
import styled from '@emotion/styled';
import { useStore } from '../context';

const HeaderWrapper = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 22px 28px 18px;
  border-bottom: 1px solid rgba(121, 236, 206, 0.08);
  background: rgba(3, 4, 5, 0.95);
`;

const Logo = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 4px;
  text-transform: uppercase;
  background: linear-gradient(135deg, #6ff2d0, #3ec8d7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  color: #70757d;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
`;

const Dot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #79ecce;
  box-shadow: 0 0 14px rgba(121, 236, 206, 0.55);
`;

export function Header() {
  return (
    <HeaderWrapper>
      <Logo>CONNECT</Logo>
      <Meta>
        <span>Storefront archive</span>
        <Dot />
        <span>Curated assets</span>
      </Meta>
    </HeaderWrapper>
  );
}

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

const SearchMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #7ee8cd;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  white-space: nowrap;
`;

const SearchIcon = styled.div`
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
  const { searchKeyword, setSearchKeyword } = useStore();

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchKeyword(e.target.value);
    },
    [setSearchKeyword]
  );

  return (
    <SearchWrapper>
      <SearchInput
        type="text"
        placeholder="Find the items you're looking for"
        value={searchKeyword}
        onChange={handleSearch}
      />
      <SearchMeta>
        <span>Keyword search</span>
        <SearchIcon>⌕</SearchIcon>
      </SearchMeta>
    </SearchWrapper>
  );
}
