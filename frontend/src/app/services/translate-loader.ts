import {HttpClient} from '@angular/common/http';
import {TranslateService} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {build} from 'src/environments/version';
import {ApplicationLanguage, LocalStorageKey} from '../../environments/defaults';
import {DebugModeService} from './debug-mode.service';

export function CvdLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, undefined, `.json?v=${build.commit}`);
}

export function getPreferredBrowserLanguage() {
  if (navigator.languages !== undefined) {
    // 0th item of navigator.languages is the preferred language
    return navigator.languages[0];
  } else { // IE Fallback
    return navigator.language;
  }
}

export function loadTranslations(
  translateService: TranslateService,
  debugService: DebugModeService,
): () => Promise<void> {

  return () => {
    const languages = Object.values(ApplicationLanguage) as string[];
    translateService.addLangs(languages);

    const defaultLang = ApplicationLanguage.CZECH;
    let lang = defaultLang as string;

    // TODO enable in non debug mode after translation finished
    if (debugService.getDebugMode()) {
      lang = localStorage.getItem(LocalStorageKey.LANGUAGE) || getPreferredBrowserLanguage().substr(0, 2);
      if (!languages.includes(lang)) lang = defaultLang;
      localStorage.setItem(LocalStorageKey.LANGUAGE, lang);
    }

    translateService.setDefaultLang(lang);

    return translateService.use(lang).toPromise();
  };
}
