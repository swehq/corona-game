import {Injectable} from '@angular/core';
import {CanDeactivate} from '@angular/router';
import {GameComponent} from './game.component';

@Injectable()
export class CanDeactivateGame implements CanDeactivate<GameComponent> {
  canDeactivate(
    component: GameComponent,
  ) {
    component.pause();
    return true;
  }
}
