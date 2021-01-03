import {Pipe, PipeTransform} from '@angular/core';
import {formatNumber} from '../utils/format';

@Pipe({
  name: 'formatPercentage',
})
export class FormatPercentagePipe implements PipeTransform {

  transform(value: number | null | undefined): any {
    value = value || 0;
    value = Math.round(100 * value);
    return formatNumber(value, false, false) + ' %';
  }
}
