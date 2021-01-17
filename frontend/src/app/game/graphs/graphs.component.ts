import {AfterViewInit, Component, QueryList, ViewChildren} from '@angular/core';
import {FormControl} from '@angular/forms';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ChartOptions} from 'chart.js';
import {last} from 'lodash';
import {Observable} from 'rxjs';
import {filter, map} from 'rxjs/operators';
import {formatNumber} from '../../utils/format';
import {GameService} from '../game.service';
import {MitigationsService} from '../mitigations-control/mitigations.service';
import {ChartValue, colors, DataLabelNode, LineGraphComponent, NodeState} from './line-graph/line-graph.component';


@UntilDestroy()
@Component({
  selector: 'cvd-graphs',
  templateUrl: './graphs.component.html',
  styleUrls: ['./graphs.component.scss'],
})
export class GraphsComponent implements AfterViewInit {

  @ViewChildren(LineGraphComponent) lineGraphs!: QueryList<LineGraphComponent>;

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
  deathTotal$: Observable<ChartValue[]> | undefined;
  immunizedChart$: Observable<ChartValue[][]> | undefined;
  immunized$: Observable<number> | undefined;

  dataLabelNodes: DataLabelNode[] = [];
  templateData: any | undefined;
  activeTab = 0;

  private readonly emptyDataLabelNode: DataLabelNode = {
    uiChange: undefined,
    event: undefined,
  };

  private newDataLabelNode: DataLabelNode = {...this.emptyDataLabelNode};

  private costDailyThresholds(value: number): NodeState {
    if (value < 500_000_000) return 'ok';
    if (value < 2_000_000_000) return 'warn';
    return 'critical';
  }

  private deathDailyThresholds(value: number): NodeState {
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

    this.mitigationsService.changesDaily$.pipe(untilDestroyed(this)).subscribe(changed => {
      const forcedChanges: string[] = [];
      changed.changed.forEach(ch => {
        forcedChanges.push(MitigationsService.mitigationsI18n[ch][String(changed.newValue[ch])]);
      });

      this.newDataLabelNode.uiChange = forcedChanges.length ? forcedChanges : undefined;
    });

    data$.pipe(
      map(gameStates => gameStates.length),
      untilDestroyed(this),
    ).subscribe(length => {
      if (this.gameService.activatedEvent) {
        this.newDataLabelNode.event = this.gameService.activatedEvent;
      }
      this.dataLabelNodes[length - 1] = {...this.newDataLabelNode};
      this.newDataLabelNode = {...this.emptyDataLabelNode};
    });

    this.infectedToday$ = data$.pipe(
      map(gameStates => gameStates.map(gs => ({
        label: new Date(gs.date),
        value: gs.stats.detectedInfections.today,
        tooltipLabel: (value: number) => `Nově nakažení: ${formatNumber(value)}`,
        state: this.infectedThresholds(gs.stats.detectedInfections.today),
      }))),
    );

    this.costTotal$ = data$.pipe(
      map(gameStates => gameStates.map(gs => ({
        label: new Date(gs.date),
        value: gs.stats.costs.total,
        tooltipLabel: (value: number) => `Celkové náklady: ${formatNumber(value, true, true)}`,
        state: this.costDailyThresholds(gs.stats.costs.today),
      }))),
    );

    this.deathTotal$ = data$.pipe(
      map(gameStates => gameStates.map(gs => ({
        label: new Date(gs.date),
        value: gs.stats.deaths.total,
        tooltipLabel: (value: number) => `Zemřelí: ${formatNumber(value)}`,
        state: this.deathDailyThresholds(gs.stats.deaths.today),
      }))),
    );

    this.immunizedChart$ = data$.pipe(
      map(gameStates => gameStates.map(gs => ([
        {
          label: new Date(gs.date),
          value: gs.stats.vaccinated.total,
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
          label: new Date(gs.date),
          value: gs.stats.estimatedResistant.total,
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
        icon: 'coronavirus',
        headerData$: this.infectedToday$.pipe(map(gs => last(gs)?.value)),
        prefix: '+',
        data$: this.infectedToday$,
        customOptions: null,
        pipe: [false, false],
      },
      {
        label: 'Zemřelí',
        svgIcon: 'skull',
        headerData$: this.deathTotal$.pipe(map(gs => last(gs)?.value)),
        data$: this.deathTotal$,
        customOptions: null,
        pipe: [false, false],
      },
      {
        label: 'Celkové náklady',
        svgIcon: 'money',
        headerData$: this.costTotal$.pipe(map(gs => last(gs)?.value)),
        data$: this.costTotal$,
        customOptions: this.costTotalCustomOptions,
        pipe: [true, true],
      },
      {
        label: 'Imunní',
        svgIcon: 'vaccine',
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
      this.newDataLabelNode = {...this.emptyDataLabelNode};
      this.dataLabelNodes = [];
    });
  }

  takeImage() {
    if (!this.lineGraphs?.length) return undefined;
    return this.lineGraphs.first.takeImage();
  }
}
