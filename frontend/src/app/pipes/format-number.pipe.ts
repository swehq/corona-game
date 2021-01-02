import {Pipe, PipeTransform} from '@angular/core';
import {formatNumber} from '../utils/format';

@Pipe({
  name: 'formatNumber',
})
export class FormatNumberPipe implements PipeTransform {

  transform(value: any, currencySymbol = false, shrink = false): any {
    return formatNumber(value, currencySymbol, shrink);
  }
}
