import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './useReduxHooks';
import { trackUserInteraction } from '../store/slices/recommendationSlice';

export default function useProductTracking(productId, type = 'view') {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);

  useEffect(() => {
    if (productId && token) {
      dispatch(trackUserInteraction({ productId, type }));
    }
  }, [productId, token, type, dispatch]);
}
