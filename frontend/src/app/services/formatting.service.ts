import {ApplicationLanguage} from '../../environments/defaults';

export interface InstantTranslateService {
  currentLang: string;

  instant(str: string): string;
}

export class FormattingService {

  protected milKey = ' mil.';
  protected bilKey = ' mld.';

  get locale() {
    return this.translateService.currentLang;
  }

  constructor(
    protected translateService: InstantTranslateService,
  ) {
  }

  formatDate(date: Date) {
    if (isNaN(date.valueOf())) return '';
    return date.toLocaleDateString(this.locale).replace(/\s+/g, '');
  }

  /**
   * Format number in a user friendly locate aware way
   * @param value - number to format
   * @param showCurrencySymbol - true if the number should be formatted as a currency
   * @param shrink - true if large numbers are displayed in millions or bilions
   * @param accuracy - the minimum number of significant digits to be displayed
   */
  formatNumber(
    value: number,
    showCurrencySymbol = false,
    shrink = false,
    accuracy = 1,
  ): string {
    let affix = '';
    let prefix = '';
    let formatOptions;

    if (shrink) {
      if (Math.abs(value) >= 1_000_000_000) {
        value /= 1_000_000_000;
        affix = this.translateService.instant(this.bilKey);
      } else if (Math.abs(value) >= 1_000_000) {
        value /= 1_000_000;
        affix = this.translateService.instant(this.milKey);
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
      switch (this.locale) {
        case ApplicationLanguage.CZECH:
          affix += ' Kč';
          break;
        default:
          prefix = 'CZK ' + prefix;
      }
    }

    return `${prefix}${value.toLocaleString(this.locale, formatOptions)}${affix}`;
  }

  formatStats(stats: any, shrink = true, isCost = false) {
    const ret = {} as any;

    Object.keys(stats).forEach(key => {
      const value = stats[key];
      if (typeof value === 'number') {
        ret[key] = this.formatNumber(value, isCost, shrink);
      } else {
        ret[key] = this.formatStats(value, shrink, key === 'costs' || key.endsWith('Costs'));
      }
    });

    return ret;
  }

}
