import {HttpClient} from '@angular/common/http';
import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {merge} from 'rxjs';
import {concatMap, map, tap} from 'rxjs/operators';
import {GameData} from 'src/app/services/game';
import {validateGame} from 'src/app/services/validate';
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
    private httpClient: HttpClient,
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

  private getGameData(): GameData {
    return {
      mitigations: {
        history: this.gameService.game.mitigationHistory,
        params: this.gameService.game.mitigationParams,
      },
      simulation: this.gameService.modelStates,
    };
  }

  download() {
    const dataString = JSON.stringify(this.getGameData(), null, 2);

    const element = document.createElement('a');
    element.style.display = 'none';
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(dataString));
    element.setAttribute('download', 'data.json');

    document.body.appendChild(element);
    element.click();

    document.body.removeChild(element);
  }

  validateGameData() {
    const gameData = this.getGameData();

    // TODO remove, just a testing call
    validateGame(gameData);

    // save game data
    this.httpClient.post('/api/game-data', gameData)
      .pipe(
        concatMap((i: any) => merge(
          // get results for scatter chart
          // tslint:disable-next-line:no-console
          this.httpClient.get('/api/game-data').pipe(tap(console.log)),
          // TODO remove, just a demonstration of how to get saved game data
          this.httpClient.get(`/api/game-data/${i.id}`),
        )),
      )
      .subscribe();
  }
}
