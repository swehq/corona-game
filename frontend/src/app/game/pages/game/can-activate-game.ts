import {Injectable} from '@angular/core';
import {CanActivate, Router} from '@angular/router';
import {GameService} from '../../game.service';
import {RouterUtilsService} from '../../../services/router-utils.service';

@Injectable()
export class CanActivateGame implements CanActivate {
  constructor(private routerUtils: RouterUtilsService, private router: Router, private gameService: GameService) {
  }

  canActivate() {
    this.routerUtils.setIsGame(true);
    if (!this.gameService.game) {
      this.router.navigate(['intro']);
      return false;
    }
    return true;
  }
}
