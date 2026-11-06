import { useState, useEffect } from 'react';

/**
 * Runs an API call and tracks { data, loading, error }.
 * `request` must return a promise; it re-runs whenever `deps` change.
 * Pass `null` as request to skip the call.
 */
export default function useApi(request, deps = []) {
  const [state, setState] = useState({ data: null, loading: !!request, error: null });

  useEffect(() => {
    if (!request) {
      setState({ data: null, loading: false, error: null });
      return undefined;
    }
    let isMounted = true;
    setState(prev => ({ ...prev, loading: true, error: null }));
    request()
      .then(data => { if (isMounted) setState({ data, loading: false, error: null }); })
      .catch(error => { if (isMounted) setState({ data: null, loading: false, error }); });
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
