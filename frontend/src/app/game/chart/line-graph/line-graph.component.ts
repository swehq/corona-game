import {EMPTY, Observable, Subject} from 'rxjs';
import {ChangeDetectorRef, Component, Input, OnInit, ViewChild} from '@angular/core';
import {ChartDataSets, ChartOptions} from 'chart.js';
import {BaseChartDirective, Label} from 'ng2-charts';
import {debounceTime} from 'rxjs/operators';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {FormControl, FormGroup} from '@angular/forms';

import 'chartjs-plugin-datalabels';
import 'chartjs-plugin-zoom';


export type NodeState = 'ok' | 'warn' | 'critical' | undefined;

export interface LineNode {
  value: number;
  label: string;
  event?: string;
  state: NodeState;
}


@UntilDestroy()
@Component({
  selector: 'cvd-line-graph',
  templateUrl: './line-graph.component.html',
  styleUrls: ['./line-graph.component.scss'],
})
export class LineGraphComponent implements OnInit {
  readonly colors = {
    ok: '869c66',
    warn: 'ff9502',
    critical: 'd43501',
  };

  readonly defaultDataset: ChartDataSets = {
    borderColor: `#${this.colors.ok}`,
    backgroundColor: `#${this.colors.ok}33`,
    pointRadius: 4,
    pointBackgroundColor: context => {
      return context.dataIndex && this.eventNodes[context.dataIndex] ? `#${this.colors.ok}` : `#${this.colors.ok}33`;
    },
    pointBorderColor: `#${this.colors.ok}`,
    pointBorderWidth: context => context.dataIndex && this.eventNodes[context.dataIndex] ? 3 : 1,
    pointHitRadius: 5,
  };

  readonly defaultZoom = 0;

  @Input()
  reset$: Observable<void> = EMPTY;

  @Input() title = '';
  @Input() tick$!: Observable<LineNode>;
  @ViewChild(BaseChartDirective, {static: false}) chart!: BaseChartDirective;

  private panAutoReset$ = new Subject();
  private currentState: NodeState = 'ok';
  private currentDatasetIndex = 0;
  private eventNodes: (string | undefined)[] = [];
  private seriesLength = 0;
  private lastValue: number | undefined;
  private font = {
    // TODO ensure this is correct
    family: '"worksans", "Helvetica Neue", arial',
    size: 11,
    weight: 600,
  };

  formGroup = new FormGroup({
    chartScope: new FormControl(this.defaultZoom),
  });

  scope: number | null = null;
  scopeLabel: string | null = null;
  datasets: ChartDataSets[] = [{...this.defaultDataset, data: []}];
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
        label: tooltipItem => {
          this.panAutoReset$.next();
          return `Počet nakažených: ${tooltipItem?.yLabel?.toLocaleString()}`;
        },
        title: tooltipItem => (tooltipItem[0].index && this.eventNodes[tooltipItem[0].index]) || '',
      },
    },
    scales: {
      yAxes: [{
        ticks: {
          callback: value => value.toLocaleString(),
        },
      }],
    },
    plugins: {
      datalabels: {
        anchor: 'center',
        clamp: true,
        align: 'end',
        offset: 5,
        textAlign: 'center',
        backgroundColor: 'white',
        borderColor: 'blue',
        borderRadius: 3,
        display: context => Boolean(this.eventNodes[context.dataIndex]),
        formatter: (_, context) => this.eventNodes[context.dataIndex],
        font: this.font,
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
          speed: 2,
          onPanComplete: () => {
            this.panAutoReset$.next();
          },
        },
      },
    },
  };

  constructor(private cd: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.panAutoReset$.pipe(
      debounceTime(3000),
      untilDestroyed(this),
    ).subscribe(() => {
      (this.chart.chart as any).scales['x-axis-0'].options.ticks.max = null;
      this.applyScope();
    });

    this.formGroup.get('chartScope')?.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe(value => {
      this.setScopeLabel(value);
      if (value === 0) {
        this.resetScope();
        return;
      }

      if (value === 1) this.scope = 90;
      if (value === 2) this.scope = 30;

      this.applyScope();
    });

    this.setScopeLabel(this.defaultZoom);

    this.options.title = {
      text: this.title,
      display: Boolean(this.title),
    };

    this.tick$.pipe(
      untilDestroyed(this),
    ).subscribe(tick => {
      if (tick.state === this.currentState) {
        this.datasets[this.currentDatasetIndex].data!.push(tick.value);
      } else {
        this.currentState = tick.state;
        this.currentDatasetIndex++;

        const padData = this.seriesLength ?
          [...Array(this.seriesLength - 1).fill(NaN), this.lastValue] :
          [];

        this.datasets = [...this.datasets, {
          ...this.defaultDataset,
          borderColor: `#${this.colors[tick.state!]}`,
          backgroundColor: `#${this.colors[tick.state!]}33`,
          data: [...padData, tick.value],
        }];
      }

      this.seriesLength++;
      this.lastValue = tick.value;
      this.labels.push(tick.label);
      this.eventNodes.push(tick.event);
      this.applyScope();

      this.cd.detectChanges();
    });

    this.reset$.pipe(
      untilDestroyed(this),
    ).subscribe(() => this.reset());
  }

  reset() {
    this.datasets = [{...this.defaultDataset, data: []}];
    this.labels = [];
    this.eventNodes = [];
    this.currentState = 'ok';
    this.currentDatasetIndex = 0;
    this.seriesLength = 0;
    this.lastValue = undefined;
  }

  resetScope() {
    this.scope = null;
    (this.chart.chart as any).scales['x-axis-0'].options.ticks.min = null;
    this.chart.update();
  }

  applyScope() {
    if (!this.scope) return;
    if (this.labels.length - 1 < this.scope) {
      (this.chart.chart as any).scales['x-axis-0'].options.ticks.min = null;
      this.chart.update();
      return;
    }

    const minTicks = [...this.labels].reverse()[this.scope!];
    (this.chart.chart as any).scales['x-axis-0'].options.ticks.min = minTicks;
    this.chart.update();
  }

  setScopeLabel(scopeLevel: number) {
    if (scopeLevel === 0) this.scopeLabel = 'Celý graf';
    if (scopeLevel === 1) this.scopeLabel = 'Kvartál';
    if (scopeLevel === 2) this.scopeLabel = 'Měsíc';
  }
}
