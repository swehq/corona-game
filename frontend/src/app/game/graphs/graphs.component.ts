import {AfterViewInit, Component} from '@angular/core';
import {FormControl} from '@angular/forms';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ChartOptions} from 'chart.js';
import {last} from 'lodash';
import {Observable, Subscription} from 'rxjs';
import {filter, map} from 'rxjs/operators';
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

  scopeFormControl = new FormControl(0);

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
  immunizedCustomOptions: ChartOptions = {
    legend: {
      display: true,
    },
    scales: {
      yAxes: [{
        stacked: true,
      }],
    },
  };

  infectedToday$: Observable<ChartValue[]> | undefined;
  costTotal$: Observable<ChartValue[]> | undefined;
  deathToday$: Observable<ChartValue[]> | undefined;
  immunizedChart$: Observable<ChartValue[][]> | undefined;
  immunized$: Observable<number> | undefined;

  mitigations$: Subscription | undefined;
  mitigationNodes: (string | undefined)[] = [];
  templateData: any | undefined;
  activeTab = 0;

  private currentMitigation: string | undefined;

  private costDailyThresholds(value: number): NodeState {
    if (value < 500_000_000) return 'ok';
    if (value < 2_000_000_000) return 'warn';
    return 'critical';
  }

  private deathThresholds(value: number): NodeState {
    if (value < 50) return 'ok';
    if (value < 150) return 'warn';
    return 'critical';
  }

  private infectedThresholds(value: number): NodeState {
    if (value < 5_000) return 'ok';
    if (value < 15_000) return 'warn';
    return 'critical';
  }

  constructor(
    public gameService: GameService,
    private mitigationsService: MitigationsService,
  ) {
    this.scopeFormControl.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe(
      newVal => this.scopeFormControl.setValue(newVal, {emitEvent: false}),
    );

    const data$ = this.gameService.gameState$;

    this.mitigations$ = data$.pipe(
      untilDestroyed(this),
      map(d => d.length),
    ).subscribe(length => {
      this.mitigationNodes[length - 1] = this.currentMitigation;
      this.currentMitigation = undefined;
    });

    this.infectedToday$ = data$.pipe(
      map(gameStates => gameStates.map(gs => ({
        label: gs.date,
        value: gs.stats.detectedInfections.today,
        tooltipLabel: (value: number) => `Nově nakažení: ${formatNumber(value)}`,
        state: this.infectedThresholds(gs.stats.detectedInfections.today),
      }))),
    );

    this.costTotal$ = data$.pipe(
      map(gameStates => gameStates.map(gs => ({
        label: gs.date,
        value: gs.stats.costs.total,
        tooltipLabel: (value: number) => `Celkové náklady: ${formatNumber(value, true, true)}`,
        state: this.costDailyThresholds(gs.stats.costs.today),
      }))),
    );

    this.deathToday$ = data$.pipe(
      map(gameStates => gameStates.map(gs => ({
        label: gs.date,
        value: gs.stats.deaths.today,
        tooltipLabel: (value: number) => `Nově zemřelí: ${formatNumber(value)}`,
        state: this.deathThresholds(gs.stats.deaths.today),
      }))),
    );

    this.immunizedChart$ = data$.pipe(
      map(gameStates => gameStates.map(gs => ([
        {
          label: gs.date,
          value: Math.round(gs.stats.vaccinationRate * gs.sirState.suspectible),
          tooltipLabel: (value: number) => `Očkovaní: ${formatNumber(value)}`,
          datasetOptions: {
            backgroundColor: `${colors.critical}33`,
            borderColor: `${colors.warn}`,
            label: 'Očkovaní',
            fill: 'origin',
          },
          color: colors.warn,
        },
        {
          label: gs.date,
          value: Math.round(gs.sirState.resistant),
          tooltipLabel: (value: number) => `Imunní po nemoci: ${formatNumber(value)}`,
          datasetOptions: {
            label: 'Imunní po nemoci',
            fill: '-1',
          },
        },
      ]))),
    );

    this.immunized$ = this.immunizedChart$.pipe(
      filter(states => states.length > 0),
      map(states => states[states.length - 1]),
      map(state => state[0].value + state[1].value),
    );

    this.activeTab = 0;

    this.templateData = [
      {
        label: 'Nově nakažení',
        icon: 'virus',
        headerData$: this.infectedToday$.pipe(map(gs => last(gs)?.value)),
        data$: this.infectedToday$,
        customOptions: null,
        pipe: [false, false],
      },
      {
        label: 'Nově zemřelí',
        icon: 'skull',
        headerData$: this.deathToday$.pipe(map(gs => last(gs)?.value)),
        data$: this.deathToday$,
        customOptions: null,
        pipe: [false, false],
      },
      {
        label: 'Celkové náklady',
        icon: 'money',
        headerData$: this.costTotal$.pipe(map(gs => last(gs)?.value)),
        data$: this.costTotal$,
        customOptions: this.costTotalCustomOptions,
        pipe: [true, true],
      },
      {
        label: 'Imunní',
        icon: 'hospital',
        headerData$: this.immunized$,
        multiLineData$: this.immunizedChart$,
        customOptions: this.immunizedCustomOptions,
        pipe: [false, false],
      },
    ];
  }

  ngAfterViewInit() {
    this.gameService.reset$.pipe(
      untilDestroyed(this),
    ).subscribe(() => {
      this.currentMitigation = undefined;
      this.mitigationNodes = [];
    });

    // TODO connect to change-only mitigation structure
    // and make mitigationNodes a dictionary of dates
    for (const mitigation of Object.keys(MitigationsService.mitigationsI18n)) {
      this.mitigationsService.formGroup.get(mitigation)?.valueChanges.pipe(
        untilDestroyed(this),
      ).subscribe((value: any) => {
        const label = this.mitigationsService.getLabel(
          mitigation as keyof typeof MitigationsService.mitigationsI18n, value);
        if (this.currentMitigation) this.currentMitigation += '\n' + label;
        else this.currentMitigation = label;
      });
    }
  }
}
