import {Injectable} from '@angular/core';

const LOCAL_STORAGE_KEY = 'debugMode';

@Injectable({
  providedIn: 'root',
})
export class DebugModeService {
  private _debugMode = false;

  init() {
    const key = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!key) return;

    try {
      this._debugMode = key ? JSON.parse(key) : false;
    } catch (e) {
      console.error('debugMode can be set only to true / false');
    }
  }

  setDebugMode(value: boolean) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
    this._debugMode = value;
  }

  getDebugMode() {
    return this._debugMode;
  }
}
