import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private _isLightTheme = new BehaviorSubject(false);
  isLightTheme$ = this._isLightTheme.asObservable();

  set isLightTheme(newVal: boolean) {
    this._isLightTheme.next(newVal);
  }
}
