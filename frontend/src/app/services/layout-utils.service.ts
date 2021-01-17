import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LayoutUtilsService {
  private isGame = new BehaviorSubject<boolean>(false);

  getIsGame() {
    return this.isGame.asObservable();
  }

  setIsGame(value: boolean) {
    this.isGame.next(value);
  }
}
