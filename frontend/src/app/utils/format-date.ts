import {formatDate as ngFormatDate} from '@angular/common';
import {getCurrentLang, ApplicationLanguage} from '../services/translate-loader';

export function formatDate(date: Date) {
  const locale = getCurrentLang();
  if (isNaN(date.valueOf())) return '';
  if (locale === ApplicationLanguage.CZECH) return ngFormatDate(date, 'd.M.y', locale);

  return date.toLocaleDateString(locale);
}
