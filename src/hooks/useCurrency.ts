import { useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { formatCurrency } from '@/utils/helpers';

/**
 * Returns the active currency and a formatter that uses it.
 * Use this in every component that displays a money amount.
 *
 *   const { currency, formatAmount } = useCurrency();
 *   <Text>{formatAmount(1234.5)}</Text>  →  "₹1,234.50"
 *
 * `formatAmount` has a stable identity for a given currency, so it is safe
 * to pass to memoized children.
 */
export function useCurrency() {
  const currency = useStore(s => s.currency);

  const formatAmount = useCallback(
    (amount: number): string => formatCurrency(amount, currency),
    [currency]
  );

  return { currency, formatAmount };
}
