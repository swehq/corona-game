import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ConfigService} from '../../services/config.service';
import {GameService, Speed} from '../game.service';

@UntilDestroy()
@Component({
  selector: 'cvd-simulation-control',
  templateUrl: './simulation-control.component.html',
  styleUrls: ['./simulation-control.component.scss'],
})
export class SimulationControlComponent implements OnInit {
  speed: Speed | undefined;

  constructor(
    private cd: ChangeDetectorRef,
    public gameService: GameService,
    public configService: ConfigService,
  ) { }

  ngOnInit() {
    this.gameService.speed$.pipe(
      untilDestroyed(this),
    ).subscribe(speed => {
      this.speed = speed;
      this.cd.markForCheck();
    });
  }

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
