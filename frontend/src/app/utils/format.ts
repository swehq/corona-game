export function formatNumber(value: number, showCurrencySymbol = false, shrink = false, accuracy = 0): string {
  let affix = '';

  if (accuracy) {
    value /= accuracy;
    value = Math.round(value);
    value *= accuracy;
  }

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

  affix += showCurrencySymbol ? ' Kč' : '';

  return `${value.toLocaleString()}${affix}`;
}
