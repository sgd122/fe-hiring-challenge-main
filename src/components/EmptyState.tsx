import styled from '@emotion/styled';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 64px 16px;
  text-align: center;
  color: #8a9097;
`;

const Title = styled.h2`
  margin: 0;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #d6dadd;
`;

const Description = styled.p`
  margin: 0;
  font-size: 13px;
  max-width: 360px;
  line-height: 1.5;
`;

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = 'No items match your filters',
  description = 'Try adjusting your search keyword, pricing options, or price range to see more results.',
}: EmptyStateProps) {
  return (
    <Wrapper role="status">
      <Title>{title}</Title>
      <Description>{description}</Description>
    </Wrapper>
  );
}
