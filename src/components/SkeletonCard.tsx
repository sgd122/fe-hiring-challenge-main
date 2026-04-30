import './Content.css';

export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-image skeleton-pulse" />
      <div className="skeleton-info">
        <div className="skeleton-line skeleton-pulse" style={{ width: '70%' }} />
        <div className="skeleton-line skeleton-pulse" style={{ width: '40%' }} />
      </div>
    </div>
  );
}
