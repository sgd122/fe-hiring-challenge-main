import { useEffect, useState } from 'react';

const computeColumns = (width: number): number => {
  if (width <= 480) return 1;
  if (width <= 768) return 2;
  if (width <= 1200) return 3;
  return 4;
};

const getInitialColumns = (): number => {
  if (typeof window === 'undefined') return 4;
  return computeColumns(window.innerWidth);
};

export const useColumns = (): number => {
  const [columns, setColumns] = useState<number>(getInitialColumns);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setColumns((prev) => {
        const next = computeColumns(window.innerWidth);
        return next === prev ? prev : next;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return columns;
};
