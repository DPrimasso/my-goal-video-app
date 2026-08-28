import { useCallback, useEffect, useRef, useState } from 'react';

export function useGeneratedImage() {
  const [url, setUrl] = useState<string | null>(null);
  const currentUrl = useRef<string | null>(null);

  const replace = useCallback((nextUrl: string | null) => {
    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    currentUrl.current = nextUrl;
    setUrl(nextUrl);
  }, []);

  const reset = useCallback(() => replace(null), [replace]);

  useEffect(() => () => {
    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
  }, []);

  return { url, replace, reset };
}
