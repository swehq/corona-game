export function formatNumber(value: number, showCurrencySymbol = false, shrink = false,
  accuracy = shrink ? 1 : 2): string {
  let affix = '';

  if (shrink) {
    if (value >= 1_000_000_000) {
      value /= 1_000_000_000;
      affix = ' mld.';
    }
    else if (value >= 1_000_000) {
      value /= 1_000_000;
      affix = ' mil.';
    }
  }

  if (accuracy) {
    value /= accuracy;
    value = Math.round(value);
    value *= accuracy;
  }

  affix += showCurrencySymbol ? ' Kč' : '';

  return `${value.toLocaleString()}${affix}`;
}
