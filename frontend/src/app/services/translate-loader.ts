import {HttpClient} from '@angular/common/http';
import {TranslateService} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {build} from 'src/environments/version';
import {ApplicationLanguage, LocalStorageKey} from '../../environments/defaults';

export function CvdLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, undefined, `.json?v=${build.commit}`);
}

export function getPreferredBrowserLanguage() {
  const englishDomains = [
    'covidgame.info',
    'www.covidgame.info',
  ];

  if (englishDomains.includes(document.location.hostname)) return ApplicationLanguage.ENGLISH;
  if (navigator.languages !== undefined) return navigator.languages[0];

  // IE fallback
  return navigator.language;
}

export function loadTranslations(
  translateService: TranslateService,
): () => Promise<void> {

  return () => {
    const languages = Object.values(ApplicationLanguage) as string[];
    translateService.addLangs(languages);

    let lang = localStorage.getItem(LocalStorageKey.LANGUAGE) || getPreferredBrowserLanguage().substr(0, 2);
    if (!languages.includes(lang)) lang = ApplicationLanguage.CZECH;

    localStorage.setItem(LocalStorageKey.LANGUAGE, lang);
    translateService.setDefaultLang(lang);

    return translateService.use(lang).toPromise();
  };
}
