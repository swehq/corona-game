import {Injectable} from '@angular/core';
import {LocalStorageKey} from 'src/environments/defaults';

@Injectable({
  providedIn: 'root',
})
export class DebugModeService {
  private _debugMode = false;

  constructor() {
    const key = localStorage.getItem(LocalStorageKey.DEBUG_MODE);
    if (!key) return;

    try {
      this._debugMode = JSON.parse(key);
    } catch (e) {
      console.error('debugMode can be set only to true / false');
    }
  }

  setDebugMode(value: boolean) {
    localStorage.setItem(LocalStorageKey.DEBUG_MODE, JSON.stringify(value));
    this._debugMode = value;
  }

  getDebugMode() {
    return this._debugMode;
  }
}
