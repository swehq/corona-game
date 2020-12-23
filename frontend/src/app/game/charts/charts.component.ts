import {Component} from '@angular/core';
import {GameService} from '../game.service';

@Component({
  selector: 'cvd-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss']
})
export class ChartsComponent {

  constructor(public gameService: GameService) {
  }

}
