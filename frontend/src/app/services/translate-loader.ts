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
  ) {}

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
  }
  else { // IE Fallback
    return navigator.language;
  }
}

export function loadTranslations(
  translateService: TranslateService,
  debugService: DebugModeService,
  ): () => Promise<void> {

  return () => {
    if (localStorage.getItem(LocalStorageKey.LANGUAGE) === null) {
      const userLocal = getPreferredBrowserLanguage();
      let languageFromLocal;

      if (userLocal.includes('cs')) languageFromLocal = ApplicationLanguage.CZECH;
      else languageFromLocal = ApplicationLanguage.ENGLISH;

      localStorage.setItem(LocalStorageKey.LANGUAGE, languageFromLocal);
    }
    translateService.addLangs([
      ApplicationLanguage.CZECH,
      ApplicationLanguage.ENGLISH,
    ]);

    const lang = debugService.getDebugMode() ?
      localStorage.getItem(LocalStorageKey.LANGUAGE) || navigator.languages[0] :
      'cs';

    translateService.setDefaultLang(lang);

    return translateService.use(lang).toPromise();
  };
}
