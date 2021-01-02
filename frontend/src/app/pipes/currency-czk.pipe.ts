import {Pipe, PipeTransform} from '@angular/core';
import {formatCZK} from '../utils/format';

@Pipe({
  name: 'currencyCZK',
})
export class CurrencyCZKPipe implements PipeTransform {

  transform(value: any, currencySymbol = true): any {
    return formatCZK(value, currencySymbol);
  }
}
