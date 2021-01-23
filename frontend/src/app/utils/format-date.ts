import {formatDate as ngFormatDate} from '@angular/common';
import {locale} from './format';

export function formatDate(date: Date) {
  return isNaN(date.valueOf()) ? '' : ngFormatDate(date, 'd.M.y', locale);
}
