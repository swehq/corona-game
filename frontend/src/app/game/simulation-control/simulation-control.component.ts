import {Component} from '@angular/core';
import {GameService} from '../game.service';

@Component({
  selector: 'cvd-simulation-control',
  templateUrl: './simulation-control.component.html',
  styleUrls: ['./simulation-control.component.scss']
})
export class SimulationControlComponent {
  constructor(
    public gameService: GameService,
  ) { }

  download() {
    const element = document.createElement('a');
    element.style.display = 'none';

    const data = JSON.stringify(this.gameService.modelStates, null, 2);
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
    element.setAttribute('download', 'data.json');

    document.body.appendChild(element);
    element.click();

    document.body.removeChild(element);
  }
}
