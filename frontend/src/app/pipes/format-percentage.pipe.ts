import {Pipe, PipeTransform} from '@angular/core';
import {I18nService} from '../services/i18n.service';

@Pipe({
  name: 'formatPercentage',
})
export class FormatPercentagePipe implements PipeTransform {

  constructor(
    private i18nService: I18nService,
  ) {
  }

  transform(value: number | null | undefined): any {
    value = value || 0;
    value = Math.round(100 * value);
    return this.i18nService.formatNumber(value, false, false, 1) + ' %';
  }
}
