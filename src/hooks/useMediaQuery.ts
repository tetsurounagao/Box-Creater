import { useEffect, useState } from 'react';

export const MOBILE_QUERY = '(max-width: 600px)';

/** メディアクエリの一致状態を購読する */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** スマホ相当の幅か */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_QUERY);
}

/** タッチなど粗いポインタか */
export function useIsCoarsePointer(): boolean {
  return useMediaQuery('(pointer: coarse)');
}
