import {HttpClient} from '@angular/common/http';
import {TranslateLoader, TranslateService} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {combineLatest, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {LocalStorageKey} from '../../environments/defaults';
import {DebugModeService} from './debug-mode.service';

export enum ApplicationLanguage {
  CZECH = 'cs',
  ENGLISH = 'en',
}

export function CvdLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

function checkDictionaryEmpty(dictionary: object) {
  if (!Object.keys(dictionary).length) {
    // tslint:disable-next-line:no-console
    console.error('Dictionary is empty');
    // tslint:disable-next-line:no-console
    console.error(dictionary);
  }
}


export class CvdTranslateLoader implements TranslateLoader {

  constructor(
    private httpClient: HttpClient,
  ) {
  }

  getTranslation(lang: ApplicationLanguage): Observable<any> {
    const dictionaryObservables: Observable<object>[] = [];
    const frontendDictionary$ = this.httpClient.get(`/assets/i18n/${lang}.json`);
    dictionaryObservables.push(frontendDictionary$);

    return combineLatest(dictionaryObservables).pipe(
      map(dictionaries => {
        const frontendDictionary = dictionaries[0] ?? {};

        checkDictionaryEmpty(frontendDictionary);

        return {
          ...frontendDictionary,
        };
      }),
    );
  }
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
