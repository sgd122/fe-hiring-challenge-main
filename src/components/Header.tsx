import styled from '@emotion/styled';

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
