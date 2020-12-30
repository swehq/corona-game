import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {LocalStorageKey} from '../../environments/defaults';

export interface Config {
  themeIsLight: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {

  private _config$ = new BehaviorSubject<Partial<Config>>({});
  config$ = this._config$.asObservable();

  update(newVal: Partial<Config>) {
    const newValue = {
      ...this._config$.value,
      ...newVal,
    };
    localStorage.setItem(LocalStorageKey.CONFIG, JSON.stringify(newValue));
    this._config$.next(newVal);
  }

  constructor() {
    try {
      const storedValue = localStorage.getItem(LocalStorageKey.CONFIG);
      if (storedValue) this._config$.next(JSON.parse(storedValue));
    } catch (e) {
    }
  }
}
