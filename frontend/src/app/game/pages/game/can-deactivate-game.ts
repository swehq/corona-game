import {Injectable} from '@angular/core';
import {CanDeactivate} from '@angular/router';
import {LayoutUtilsService} from 'src/app/services/layout-utils.service';
import {GameComponent} from './game.component';

@Injectable()
export class CanDeactivateGame implements CanDeactivate<GameComponent> {
  constructor(private layoutUtils: LayoutUtilsService) {}

  canDeactivate(
    component: GameComponent,
  ) {
    component.pause();
    this.layoutUtils.setIsGame(false);

    return true;
  }
}
