import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../utils/formatters';

/**
 * Runs an async loader on mount (and whenever `deps` change) and exposes
 * { data, loading, error, reload }.
 */
export default function useFetch(loader, deps = [], initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const reload = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const result = await loaderRef.current();
      setData(result);
      setError(null);
      return result;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, setData, loading, error, reload };
}
