import {Component} from '@angular/core';
import {MetaService} from 'src/app/services/meta.service';
import {GameService} from '../../game.service';

@Component({
  selector: 'cvd-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.scss'],
})
export class IntroComponent {
  constructor(meta: MetaService, public gameService: GameService) {
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
