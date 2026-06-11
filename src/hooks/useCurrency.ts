import { useStore } from '@/store/useStore';

/**
 * Returns the active currency and a formatter that uses it.
 * Use this in every component that displays a money amount.
 *
 *   const { currency, formatAmount } = useCurrency();
 *   <Text>{formatAmount(1234.5)}</Text>  →  "₹1,234.50"
 */
export function useCurrency() {
  const currency = useStore(s => s.currency);

  function formatAmount(amount: number): string {
    try {
      return `${currency.symbol}${amount.toLocaleString(currency.locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    } catch {
      return `${currency.symbol}${amount.toFixed(2)}`;
    }
  }

  return { currency, formatAmount };
}
