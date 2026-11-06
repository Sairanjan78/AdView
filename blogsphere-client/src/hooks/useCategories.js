import { categoryApi } from '../services/api';
import DEFAULT_CATEGORIES, { registerCategories } from '../config/categories';
import useApi from './useApi';

/**
 * Categories with live article counts from the API.
 * Falls back to the built-in category list (count 0) while loading or if the API is unreachable.
 */
export default function useCategories() {
  const { data, loading, error } = useApi(() =>
    categoryApi.getCategories().then(res => {
      const list = res?.data?.categories || [];
      registerCategories(list);
      return list;
    })
  );

  return {
    categories: data && data.length ? data : DEFAULT_CATEGORIES,
    loading,
    error,
  };
}
