export function formatNumber(value: number, currencySymbol = false, shrink = false): string {
  if (shrink) {
    if (value < 1_000_000) {
      return `${value.toLocaleString()}${currencySymbol ? ' Kč' : ''}`;
    }

    if (value > 1_000_000 && value < 1_000_000_000) {
      value = value / 1_000_000;
      return `${value.toLocaleString()} mil.${currencySymbol ? ' Kč' : ''}`;
    }
    value = value / 1_000_000_000;
    return `${value.toLocaleString()} mild.${currencySymbol ? ' Kč' : ''}`;
  }

  return `${value.toLocaleString()}${currencySymbol ? ' Kč' : ''}`;
}
