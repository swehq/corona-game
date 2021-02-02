import {Injectable} from '@angular/core';
import {marker as _} from '@biesbjerg/ngx-translate-extract-marker';
import {TranslateService} from '@ngx-translate/core';
import {FormattingService} from './formatting.service';

@Injectable({
  providedIn: 'root',
})
export class I18nService extends FormattingService {

  protected milKey = _(' mil.');
  protected bilKey = _(' mld.');

  constructor(
    translateService: TranslateService,
  ) {
    super(translateService);
  }

}
