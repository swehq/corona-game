import {Component} from '@angular/core';
import {MetaService} from 'src/app/services/meta.service';
import {GameService} from '../../game.service';
import {Router} from '@angular/router';


@Component({
  selector: 'cvd-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.scss'],
})
export class IntroComponent {
  links: any;

  constructor(meta: MetaService, public gameService: GameService, router: Router) {
    this.links = {
      aboutLink: router.createUrlTree(['/about']).toString(),
      creditsLink: router.createUrlTree(['/credits']).toString(),
    };
    meta.setTitle('Vítejte');
  }

  loadSave() {
    if (this.gameService.loadGameFromJson()) return;
    this.loadNewGame();
  }

  loadNewGame() {
    this.gameService.restartSimulation();
  }
}
