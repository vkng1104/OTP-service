import { Currency } from "../constant";

export function currencyFromString(value: string): Currency | null {
  const upper = value.toUpperCase();
  if (upper === Currency.USD || upper === Currency.VND) {
    return upper as Currency;
  }
  return null;
}

export function getCurrencyKey(currency: Currency): string {
  return currency.toLowerCase();
}
