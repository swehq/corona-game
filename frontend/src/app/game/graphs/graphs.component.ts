import {AfterViewInit, Component} from '@angular/core';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ChartOptions} from 'chart.js';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {formatNumber} from '../../utils/format';
import {GameService} from '../game.service';
import {MitigationsService} from '../mitigations-control/mitigations.service';
import {ChartValue, colors, NodeState} from './line-graph/line-graph.component';

@UntilDestroy()
@Component({
  selector: 'cvd-graphs',
  templateUrl: './graphs.component.html',
  styleUrls: ['./graphs.component.scss'],
})
export class GraphsComponent implements AfterViewInit {
  initialized = false;

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
    state: this.infectedThresholds(gameState.stats.detectedInfections.today),
    currentMitigation: this.currentMitigation,
  })));

  costTotal$: Observable<ChartValue> = this.gameService.gameState$.pipe(map(gameState => ({
    label: gameState.date,
    value: gameState.stats.costs.total,
    tooltipLabel: (value: number) => `Celkové náklady: ${formatNumber(value, true, true)}`,
    state: this.costTotalThresholds(gameState.stats.costs.total),
    currentMitigation: this.currentMitigation,
  })));

  deathToday$: Observable<ChartValue> = this.gameService.gameState$.pipe(map(gameState => ({
    label: gameState.date,
    value: gameState.stats.deaths.today,
    tooltipLabel: (value: number) => `Nově zemřelí: ${formatNumber(value)}`,
    state: this.deathThresholds(gameState.stats.deaths.today),
    currentMitigation: this.currentMitigation,
  })));

  immunizedChart$: Observable<ChartValue[]> = this.gameService.gameState$.pipe(map(gs => ([
    {
      label: gs.date,
      value: Math.round(gs.sirState.resistant + gs.stats.vaccinationRate * gs.sirState.suspectible),
      tooltipLabel: (value: number) => `Imunizováni: ${formatNumber(value)}`,
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
    map(gameState => Math.round(gameState.sirState.resistant
      + gameState.stats.vaccinationRate * gameState.sirState.suspectible)),
  );

  private currentMitigation: string | undefined = undefined;

// TODO Add hysteresis maybe?
  private costTotalThresholds(value: number): NodeState {
    if (value < 10_000_000_000) return 'ok';
    if (value >= 10_000_000_000 && value < 50_000_000_000) return 'warn';
    if (value >= 50_000_000_000) return 'critical';
  }

  private deathThresholds(value: number): NodeState {
    if (value < 50) return 'ok';
    if (value >= 50 && value < 150) return 'warn';
    if (value >= 150) return 'critical';
  }

  private infectedThresholds(value: number): NodeState {
    if (value < 5_000) return 'ok';
    if (value >= 5_000 && value < 15_000) return 'warn';
    if (value >= 15_000) return 'critical';
  }

  constructor(public gameService: GameService, private mitigationsService: MitigationsService) {
  }

  ngAfterViewInit() {
    setTimeout(() => this.initialized = true);

    this.gameService.restartSimulation();
    this.gameService.reset$.pipe(untilDestroyed(this)).subscribe(() => this.currentMitigation = undefined);

    for (const mitigation of Object.keys(MitigationsService.mitigationsI18n)) {
      this.mitigationsService.formGroup.get(mitigation)?.valueChanges.pipe(
        untilDestroyed(this),
      ).subscribe((value: any) => {
        // TODO add multiple mitigations at a same time
        this.currentMitigation = this.mitigationsService.getLabel(
          mitigation as keyof typeof MitigationsService.mitigationsI18n, value);
      });
    }
  }
}
