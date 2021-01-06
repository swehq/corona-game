import {Component} from '@angular/core';
import {DebugModeService} from 'src/app/services/debug-mode.service';

@Component({
  selector: 'cvd-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent {
  constructor(public debugModeService: DebugModeService) {
  }
}
