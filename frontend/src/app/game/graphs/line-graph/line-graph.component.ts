import {AfterViewInit, ChangeDetectorRef, Component, Input, OnInit, ViewChild} from '@angular/core';
import {FormControl} from '@angular/forms';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ChartDataSets, ChartOptions} from 'chart.js';
import 'chartjs-plugin-datalabels';
import 'chartjs-plugin-zoom';
import {BaseChartDirective, Label} from 'ng2-charts';
import {Observable, Subject} from 'rxjs';
import {debounceTime, withLatestFrom} from 'rxjs/operators';
import {formatNumber} from '../../../utils/format';
import {GameService} from '../../game.service';

export type NodeState = 'ok' | 'warn' | 'critical' | undefined;

export interface ChartValue {
  label: string | Date;
  value: number;
  tooltipLabel: (value: number) => string;
  datasetOptions?: ChartDataSets;
  color?: string;
  state?: NodeState;
  currentMitigation?: string;
}

export const colors = {
  ok: '#869c66',
  warn: '#ff9502',
  critical: '#d43501',
};

@UntilDestroy()
@Component({
  selector: 'cvd-line-graph',
  templateUrl: './line-graph.component.html',
  styleUrls: ['./line-graph.component.scss'],
})
export class LineGraphComponent implements OnInit, AfterViewInit {

  @Input()
  customOptions: ChartOptions | null = null;

  @Input() singleLineTick$: Observable<ChartValue> | null = null;
  @Input() multiLineTick$: Observable<ChartValue[]> | null = null;
  @ViewChild(BaseChartDirective, {static: false}) chart!: BaseChartDirective;

  private panAutoReset$ = new Subject();
  private currentState: NodeState = 'ok';
  private currentDatasetIndex = 0;
  private mitigationNodes: (string | undefined)[] = [];
  private tooltipLabels: ((value: number) => string)[] = [];
  private lastMitigation: string | undefined = undefined;
  private seriesLength = 0;
  private lastValue: number | undefined;

  scopeFormControl = new FormControl(0);

  scope = 0;
  scopeLabel: string | null = null;
  datasets: ChartDataSets[] = [{...this.getDefaultDataset(), data: []}];
  labels: Label[] = [];
  options: ChartOptions = {
    title: {
      display: false,
      text: undefined,
    },
    legend: {
      display: false,
    },
    animation: {
      duration: 300,
    },
    responsive: true,
    tooltips: {
      enabled: true,
      displayColors: false,
      callbacks: {
        label: tooltipItem => this.tooltipLabels[tooltipItem.datasetIndex!](+tooltipItem.yLabel!),
        title: tooltipItem => {
          this.panAutoReset$.next();
          return (tooltipItem[0].index && this.mitigationNodes[tooltipItem[0].index]) || '';
        },
      },
    },
    scales: {
      yAxes: [{
        ticks: {
          callback: value => formatNumber(+value, false, true),
        },
      }],
    },
    plugins: {
      datalabels: {
        anchor: 'center',
        clamp: true,
        align: -45,
        offset: 5,
        textAlign: 'center',
        rotation: -45,
        backgroundColor: 'white',
        borderColor: 'blue',
        borderRadius: 3,
        padding: {
          top: 2,
          bottom: 2,
          right: 4,
          left: 4,
        },
        display: context => Boolean(this.mitigationNodes[context.dataIndex]) ? 'auto' : false,
        formatter: (_, context) => this.mitigationNodes[context.dataIndex],
        font: context => {
          const width = context.chart.width;
          const size = Math.round(width! / 64);
          return {
            family: '"worksans", "Helvetica Neue", arial',
            size: size > 16 ? 16 : size,
            weight: 600,
          };
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
          speed: 2,
          onPan: () => {
            this.panActive = true;
          },
          onPanComplete: () => {
            this.panAutoReset$.next();
          },
        },
      },
    },
  };

  panActive = false;

  constructor(private cd: ChangeDetectorRef, private gameService: GameService) {
  }

  ngOnInit() {
    this.singleLineTick$?.pipe(
      untilDestroyed(this),
    ).subscribe(tick => {
      this.tooltipLabels[this.currentDatasetIndex] = tick.tooltipLabel;
      if (tick.state === this.currentState) {
        this.datasets[this.currentDatasetIndex].data!.push(tick.value);
      } else {
        this.currentState = tick.state;
        this.currentDatasetIndex++;

        const padData = this.seriesLength ?
          [...Array(this.seriesLength - 1).fill(NaN), this.lastValue] :
          [];

        this.datasets = [...this.datasets, {
          ...this.getDefaultDataset(),
          borderColor: `${colors[tick.state!]}`,
          backgroundColor: `${colors[tick.state!]}33`,
          data: [...padData, tick.value],
        }];
      }

      this.seriesLength++;
      this.lastValue = tick.value;
      this.labels.push(typeof tick.label === 'string' ? tick.label : tick.label.toLocaleDateString());
      this.addMitigation(tick.currentMitigation);
      this.setScope();

      this.cd.markForCheck();
    });

    this.multiLineTick$?.pipe(
      untilDestroyed(this),
    ).subscribe(ticks => {
      ticks.forEach((tick, index) => {
        if (this.datasets[index]) {
          this.tooltipLabels[index] = tick.tooltipLabel;
          this.datasets[index].data!.push(tick.value);
        } else {
          this.tooltipLabels.push(tick.tooltipLabel);
          this.datasets.push({...this.getDefaultDataset(tick.color), data: [tick.value], ...tick.datasetOptions});
        }
      });

      this.labels.push((typeof ticks[0].label === 'string'
        ? ticks[0].label
        : ticks[0].label.toLocaleDateString()));

      this.addMitigation(ticks[0].currentMitigation);
    });

    this.panAutoReset$.pipe(
      debounceTime(3000),
      withLatestFrom(this.gameService.speed$),
      untilDestroyed(this),
    ).subscribe(([_, speed]) => {
      if (speed === 'pause') return;
      this.panActive = false;
      this.setXAxisTicks({max: null});
      this.setScope();
    });

    this.gameService.reset$.pipe(
      untilDestroyed(this),
    ).subscribe(() => this.reset());

    this.setScopeLabel(this.scopeFormControl.value);
    this.options = {...this.options, ...this.customOptions};
  }

  ngAfterViewInit() {
    this.scopeFormControl.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe(level => {
      this.panActive = false;
      this.setScopeLabel(level);
      this.setScope(level);
    });
  }

  private reset() {
    this.datasets = [{...this.getDefaultDataset(), data: []}];
    this.labels = [];
    this.mitigationNodes = [];
    this.currentState = 'ok';
    this.currentDatasetIndex = 0;
    this.seriesLength = 0;
    this.lastValue = undefined;
    this.tooltipLabels = [];
  }

  private setScope(level?: number) {
    if (this.panActive) return;

    if (level !== undefined) {
      this.scope = [0, 90, 30][level];
    }
    const index = this.labels.length - this.scope;
    const min = (this.scope && index > 0) ? this.labels[index] : null;
    this.setXAxisTicks({min, max: null});
    this.chart?.update();
  }

  private setScopeLabel(scopeLevel: number) {
    if (scopeLevel === 0) this.scopeLabel = 'Celý graf';
    if (scopeLevel === 1) this.scopeLabel = 'Kvartál';
    if (scopeLevel === 2) this.scopeLabel = 'Měsíc';
    this.cd.markForCheck();
  }

  private addMitigation(mitigation: string | undefined) {
    if (this.lastMitigation !== mitigation) {
      this.lastMitigation = mitigation;
      this.mitigationNodes.push(mitigation);
    } else {
      this.mitigationNodes.push(undefined);
    }
  }

  private setXAxisTicks(options: {
    min?: Label | null,
    max?: Label | null,
  }) {
    const chart = this.chart?.chart as any;
    const chartOptions = chart?.scales['x-axis-0']?.options;
    if (!chartOptions) return;
    chartOptions.ticks = {...chartOptions.ticks, ...options};
  }

  private getDefaultDataset(color = colors.ok): ChartDataSets {
    return {
      borderColor: `${color}`,
      backgroundColor: `${color}33`,
      pointBorderColor: `${color}`,
      pointBackgroundColor: context => {
        return context.dataIndex && this.mitigationNodes[context.dataIndex] ? `${color}` : `${color}33`;
      },
      pointRadius: context => context.dataIndex && this.mitigationNodes[context.dataIndex] ? 4 : 1,
      pointBorderWidth: 1,
      pointHitRadius: 5,
    };
  }
}
