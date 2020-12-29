import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {map} from 'rxjs/operators';
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

  isLightTheme$ = this.configService.config$.pipe(
    map(config => config.themeIsLight),
  );

  set isLightTheme(themeIsLight: boolean) {
    this.configService.update({themeIsLight});
  }

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
      this.cd.detectChanges();
    });
  }

  download() {
    const element = document.createElement('a');
    element.style.display = 'none';

    const source = {
      mitigations: this.gameService.game.scenario.mitigationActions,
      model: this.gameService.modelStates,
    };

    const dataString = JSON.stringify(source, null, 2);
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(dataString));
    element.setAttribute('download', 'data.json');

    document.body.appendChild(element);
    element.click();

    document.body.removeChild(element);
  }
}
