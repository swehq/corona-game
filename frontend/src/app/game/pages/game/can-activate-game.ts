import {Injectable} from '@angular/core';
import {CanActivate, Router} from '@angular/router';
import {LayoutUtilsService} from 'src/app/services/layout-utils.service';
import {GameService} from '../../game.service';

@Injectable()
export class CanActivateGame implements CanActivate {
  constructor(private layoutUtils: LayoutUtilsService, private router: Router, private gameService: GameService) {}

  canActivate() {
    this.layoutUtils.setIsGame(true);
    if (!this.gameService.game && this.gameService.isLocalStorageGame()) {
      this.router.navigate(['intro']);
      return false;
    }
    return true;
  }
}
