import { useState, useEffect, useRef } from 'react';

/**
 * Runs an API call and tracks { data, loading, error }.
 * `request` must return a promise; it re-runs whenever `deps` change.
 * Pass `null` as request to skip the call.
 *
 * `initialData` optionally seeds the first render (used by prerendered pages so
 * React paints the full article immediately). The request still runs in the
 * background to refresh it, but the first load is not put into a loading state.
 */
export default function useApi(request, deps = [], initialData = null) {
  const seeded = useRef(Boolean(initialData));
  const [state, setState] = useState({
    data: initialData,
    loading: !initialData && !!request,
    error: null,
  });

  useEffect(() => {
    if (!request) {
      setState({ data: null, loading: false, error: null });
      return undefined;
    }
    let isMounted = true;
    const firstSeededRun = seeded.current;
    if (firstSeededRun) seeded.current = false;
    // With prerendered data on screen, keep it visible while the fresh copy
    // loads; never flash a spinner over existing content.
    if (!firstSeededRun) setState(prev => ({ ...prev, loading: true, error: null }));
    request()
      .then(data => { if (isMounted) setState({ data, loading: false, error: null }); })
      .catch(error => { if (isMounted) setState(prev => ({ data: prev.data, loading: false, error })); });
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
