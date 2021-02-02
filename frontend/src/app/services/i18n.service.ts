import {formatDate} from '@angular/common';
import {Injectable} from '@angular/core';
import {marker as _} from '@biesbjerg/ngx-translate-extract-marker';
import {UntilDestroy} from '@ngneat/until-destroy';
import {TranslateService} from '@ngx-translate/core';
import {ApplicationLanguage} from './translate-loader';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class I18nService {

  get locale() {
    return this.translateService.currentLang;
  }

  constructor(
    private translateService: TranslateService,
  ) {
  }

  formatDate(date: Date) {
    if (isNaN(date.valueOf())) return '';

    switch (this.locale) {
      case ApplicationLanguage.CZECH:
        return formatDate(date, 'd.M.y', this.locale); // custom format with no spaces
      default:
        return date.toLocaleDateString(this.locale);
    }
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
        affix = this.translateService.instant(_(' mld.'));
      } else if (Math.abs(value) >= 1_000_000) {
        value /= 1_000_000;
        affix = this.translateService.instant(_(' mil.'));
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
          prefix = 'Cr ' + prefix;
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
