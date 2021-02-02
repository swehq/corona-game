import {InstantTranslateService} from '../../../frontend/src/app/services/formatting.service';

export class SimpleTranslateService implements InstantTranslateService {
  currentLang: string;

  constructor(lang: string) {
    this.currentLang = lang;
  }

  instant(string: string) {
    return string;
  }
}
