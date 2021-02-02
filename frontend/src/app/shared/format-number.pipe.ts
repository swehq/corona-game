import {Pipe, PipeTransform} from '@angular/core';
import {I18nService} from '../services/i18n.service';

@Pipe({
  name: 'formatNumber',
})
export class FormatNumberPipe implements PipeTransform {

  constructor(
    private i18nService: I18nService,
  ) {
  }

  transform(
    value: number | null | undefined,
    showCurrencySymbol = false,
    shrink = false,
    accuracy = 1,
  ): string {
    value = value || 0;
    return this.i18nService.formatNumber(value, showCurrencySymbol, shrink, accuracy);
  }
}
