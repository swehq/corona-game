import {AfterViewInit, Component} from '@angular/core';
import {GameService} from '../game.service';
import {ChartOptions} from 'chart.js';
import {formatNumber} from '../../utils/format';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {ChartValue, colors} from '../graphs/line-graph/line-graph.component';
import {MitigationsService} from '../mitigations-control/mitigations.service';

@UntilDestroy()
@Component({
  selector: 'cvd-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent implements AfterViewInit {
  costTotalCustomOptions: ChartOptions = {
    scales: {
      yAxes: [{
        ticks: {
          callback(value: number | string) {
            return formatNumber(+value, false, true);
          },
        },
      }],
    },
  };

  infectedToday$: Observable<ChartValue> = this.gameService.gameState$.pipe(map(gameState => ({
    label: gameState.date,
    value: gameState.stats.detectedInfections.today,
    tooltipLabel: (value: number) => `Nově nakažení: ${formatNumber(value)}`,
    state: 'ok',
    currentEvent: this.currentEvent,
  })));

  costTotal$: Observable<ChartValue> = this.gameService.gameState$.pipe(map(gameState => ({
    label: gameState.date,
    value: gameState.stats.costTotal,
    tooltipLabel: (value: number) => `Celkové náklady: ${formatNumber(value, true, true)}`,
    state: 'ok',
    currentEvent: this.currentEvent,
  })));

  deathToday$: Observable<ChartValue> = this.gameService.gameState$.pipe(map(gameState => ({
    label: gameState.date,
    value: gameState.stats.deaths.today,
    tooltipLabel: (value: number) => `Nově zemřelí: ${formatNumber(value)}`,
    state: 'ok',
    currentEvent: this.currentEvent,
  })));

  immunizedChart$: Observable<ChartValue[]> = this.gameService.gameState$.pipe(map(gs => ([
    {
      label: gs.date,
      value: Math.round(gs.sirState.resistant + gs.stats.vaccinationRate * gs.sirState.suspectible),
      tooltipLabel: (value: number) => `Imunizováni: ${formatNumber(value)}`,
      currentEvent: this.currentEvent,
    },
    {
      label: gs.date,
      value: gs.stats.vaccinationRate * Math.round(gs.sirState.suspectible),
      tooltipLabel: (value: number) => `Vakcinovaní: ${formatNumber(value)}`,
      datasetOptions: {
        backgroundColor: `${colors.critical}33`,
        borderColor: `${colors.warn}`,
      },
      color: colors.warn,
    },
  ])));

  immunized$ = this.gameService.gameState$.pipe(
    map(gameState => Math.round(gameState.sirState.resistant)
      + gameState.stats.vaccinationRate * Math.round(gameState.sirState.suspectible)),
    map(resistant => Math.round(resistant)),
  );

  private currentEvent: string | undefined = undefined;

  constructor(public gameService: GameService, private mitigationsService: MitigationsService) {
  }

  ngAfterViewInit() {
    this.gameService.restartSimulation();
    this.gameService.reset$.pipe(untilDestroyed(this)).subscribe(() => this.currentEvent = undefined);

    for (const mitigation of Object.keys(MitigationsService.mitigationsI18n)) {
      this.mitigationsService.formGroup.get(mitigation)?.valueChanges.pipe(
        untilDestroyed(this),
      ).subscribe((value: any) => {
        // TODO add multiple mitigations at a same time
        this.currentEvent = this.mitigationsService.getLabel(
          mitigation as keyof typeof MitigationsService.mitigationsI18n, value);
      });
    }
  }
}
