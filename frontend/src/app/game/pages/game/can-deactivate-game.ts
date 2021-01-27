import {Injectable} from '@angular/core';
import {CanDeactivate} from '@angular/router';
import {GameComponent} from './game.component';
import {RouterUtilsService} from '../../../services/router-utils.service';

@Injectable()
export class CanDeactivateGame implements CanDeactivate<GameComponent> {
  constructor(private routerUtils: RouterUtilsService) {
  }

  canDeactivate(
    component: GameComponent,
  ) {
    component.pause();
    this.routerUtils.setIsGame(false);

    return true;
  }
}
