export function formatCZK(value: number, currencySymbol = true): string {
  return value.toLocaleString('cs-CZ', currencySymbol
    ? {style: 'currency', currency: 'CZK', minimumFractionDigits: 0}
    : undefined);
}
