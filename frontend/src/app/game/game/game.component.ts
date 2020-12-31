import {AfterViewInit, Component} from '@angular/core';
import {GameService} from '../game.service';

@Component({
  selector: 'cvd-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent implements AfterViewInit {
  constructor(private gameService: GameService) {
  }

  ngAfterViewInit() {
    this.gameService.restartSimulation();
  }
}
