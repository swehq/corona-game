import {Pipe, PipeTransform} from '@angular/core';
import {formatNumber} from '../utils/format';

@Pipe({
  name: 'formatNumber',
})
export class FormatNumberPipe implements PipeTransform {

  transform(value: number | null | undefined, showCurrencySymbol = false, shrink = false) {
    value = value || 0;
    return formatNumber(value, showCurrencySymbol, shrink);
  }
}
