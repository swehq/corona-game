import {getCurrentLang, ApplicationLanguage} from '../services/translate-loader';

/**
 * Format number in a user friendly locate aware way
 * @param value - number to format
 * @param showCurrencySymbol - true if the number should be formatted as a currency
 * @param shrink - true if large numbers are displayed in millions or bilions
 * @param accuracy - the minimum number of significant digits to be displayed
 */
export function formatNumber(value: number, showCurrencySymbol = false, shrink = false,
  accuracy = 1): string {
  const locale = getCurrentLang();
  let affix = '';
  let prefix = '';
  let formatOptions;

  if (shrink) {
    if (Math.abs(value) >= 1_000_000_000) {
      value /= 1_000_000_000;
      affix = ' mld.';
    }
    else if (Math.abs(value) >= 1_000_000) {
      value /= 1_000_000;
      affix = ' mil.';
    }

    // Show at least one digit after decimal point when shrinking
    if (affix !== '') {
      accuracy = Math.max(accuracy, 2);
    }
  }

  if (accuracy) {
    let numDigitsBeforeDecimalPoint;
    if (value === 0) {
      numDigitsBeforeDecimalPoint = 1;  // 0 is a significant digit in this case
      value = 0;                        // protect against -0
    } else if (Math.abs(value) < 1) {
      numDigitsBeforeDecimalPoint = 0;
    } else {
      numDigitsBeforeDecimalPoint = Math.floor(Math.log10(Math.abs(value))) + 1;
    }
    const numFractionDigits = Math.max(0, accuracy - numDigitsBeforeDecimalPoint);
    formatOptions = {maximumFractionDigits: numFractionDigits, minimumFractionDigits: numFractionDigits};
  }

  if (showCurrencySymbol) {
    if (locale === ApplicationLanguage.CZECH) {
      affix += ' Kč';
    } else {
      prefix = 'Cr ' + prefix;
    }
  }

  return `${prefix}${value.toLocaleString(locale, formatOptions)}${affix}`;
}

export function formatStats(stats: any, shrink = true, isCost = false) {
  const ret = {} as any;

  Object.keys(stats).forEach(key => {
    const value = stats[key];
    if (typeof value === 'number') {
      ret[key] = formatNumber(value, isCost, shrink);
    } else {
      ret[key] = formatStats(value, shrink, key === 'costs' || key.endsWith('Costs'));
    }
  });

  return ret;
}
