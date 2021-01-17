import {AfterViewInit, ChangeDetectorRef, Component, Input, OnInit, ViewChild} from '@angular/core';
import {FormControl} from '@angular/forms';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ChartDataSets, ChartOptions, ChartTooltipItem} from 'chart.js';
import 'chartjs-plugin-datalabels';
import 'chartjs-plugin-zoom';
import {merge} from 'lodash';
import {BaseChartDirective, Label} from 'ng2-charts';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {formatNumber} from '../../../../utils/format';
import {GameService} from '../../../game.service';
import {Level} from '../../mitigations-control/controls/mitigation-scale.component';
import {Pan} from './pan';
import {Event, EventChoice} from '../../../../services/events';

export type NodeState = 'ok' | 'warn' | 'critical' | undefined;

export interface ChartValue {
  label: string | Date;
  value: number;
  tooltipLabel: (value: number) => string;
  datasetOptions?: ChartDataSets;
  color?: string;
  state?: NodeState;
}

export interface ActivatedEvent {
  originEvent: Event;
  choice: EventChoice | undefined;
}

export interface DataLabelNode {
  uiChange: string[] | undefined;
  event: ActivatedEvent | undefined;
}

export const colors = {
  ok: '#9fe348',
  warn: '#b57648',
  critical: '#ff4851',
  event: {
    background: '#2d2d2d',
    border: '#ff4851',
  },
};

@UntilDestroy()
@Component({
  selector: 'cvd-line-graph',
  templateUrl: './line-graph.component.html',
  styleUrls: ['./line-graph.component.scss'],
})
export class LineGraphComponent implements OnInit, AfterViewInit {
  @Input()
  customOptions: ChartOptions | undefined;

  @Input()
  dataLabelNodes: DataLabelNode[] = [];

  @Input() singleLineTick$: Observable<ChartValue[]> | undefined;
  @Input() multiLineTick$: Observable<ChartValue[][]> | undefined;
  @ViewChild(BaseChartDirective, {static: false}) chart!: BaseChartDirective;

  pan: Pan;

  scaleLevels: Level[] = [
    [0, 'Celý graf'],
    [90, 'Kvartál'],
    [30, 'Měsíc'],
  ];

  private currentState: NodeState = 'ok';
  private tooltipLabels: ((value: number) => string)[] = [];
  private seriesLength = 0;
  private lastValue: number | undefined;

  @Input()
  scopeFormControl = new FormControl(0);

  scope = 0;
  datasets: ChartDataSets[] = [];
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
        title: tooltipItem => this.formatTooltip(tooltipItem),
        label: tooltipItem => this.tooltipLabels[tooltipItem.datasetIndex!](+tooltipItem.yLabel!),
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
        color: context => this.dataLabelNodes[context.dataIndex]?.event ? '#e3dce4' : '#676767',
        backgroundColor: context => this.dataLabelNodes[context.dataIndex]?.event ? colors.event.background : 'white',
        borderColor: colors.event.border,
        borderWidth: context => this.dataLabelNodes[context.dataIndex]?.event ? 1 : 0,
        borderRadius: 3,
        padding: {
          top: 2,
          bottom: 2,
          right: 4,
          left: 4,
        },
        display: context => this.showDataLabel(context.dataIndex),
        formatter: (_, context) => this.formatDataLabel(context.dataIndex),
        font: context => {
          const width = context.chart.width;
          let size = Math.round(width! / 64);
          if (this.dataLabelNodes[context.dataIndex]?.event) size++;
          return {
            family: '"worksans", "Helvetica Neue", arial',
            size: size > 16 ? 16 : size,
            weight: 600,
          };
        },
      },
      filler: {
        propagate: true,
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
          speed: 2,
          onPan: () => {
            this.pan.panActive = true;
          },
          onPanComplete: (context: any) => {
            const max = context.chart.scales['x-axis-0'].options.ticks.max;
            this.pan.minIndex = this.labels.length - this.labels.indexOf(max);
            this.pan.panAutoReset$.next();
            this.cd.detectChanges();
          },
        },
      },
    },
  };

  constructor(public cd: ChangeDetectorRef, public gameService: GameService) {
    this.pan = new Pan(this);
  }

  showDataLabel(index: number) {
    const uiChange = this.dataLabelNodes[index]?.uiChange;
    const event = this.dataLabelNodes[index]?.event;
    return uiChange || event ? 'auto' : false;
  }

  ngOnInit() {
    this.singleLineTick$?.pipe(
      map(data => data.slice(this.seriesLength)), // just new data
      untilDestroyed(this),
    ).subscribe(data => {
      if (!data.length) {
        this.reset();
        return;
      }

      data.forEach(tick => {
        if (tick.state === this.currentState && this.datasets.length) {
          this.datasets[this.datasets.length - 1].data!.push(tick.value);
        } else {
          this.currentState = tick.state;
          const padData = this.seriesLength
            ? [...Array(this.seriesLength - 1).fill(NaN), this.lastValue]
            : [];

          this.datasets.push({
            ...this.getDefaultDataset(),
            borderColor: `${colors[tick.state!]}`,
            backgroundColor: `${colors[tick.state!]}33`,
            data: [...padData, tick.value],
            ...tick.datasetOptions,
          });
        }

        this.tooltipLabels[this.datasets.length - 1] = tick.tooltipLabel;
        this.seriesLength++;
        this.lastValue = tick.value;
        this.labels.push(typeof tick.label === 'string' ? tick.label : tick.label.toLocaleDateString());
        this.setScope();
      });
    });

    this.multiLineTick$?.pipe(
      map(data => data.slice(this.seriesLength)), // just new data
      untilDestroyed(this),
    ).subscribe(data => {
      if (!data.length) {
        this.reset();
        return;
      }

      data.forEach(ticks => {
        ticks.forEach((line, index) => {
          if (this.datasets[index]) {
            this.tooltipLabels[index] = line.tooltipLabel;
            this.datasets[index].data!.push(line.value);
          } else {
            this.tooltipLabels.push(line.tooltipLabel);
            this.datasets.push({
              ...this.getDefaultDataset(line.color),
              data: [line.value],
              ...line.datasetOptions,
            });
          }
        });

        this.seriesLength++;
        this.labels.push((typeof ticks[0].label === 'string'
          ? ticks[0].label
          : ticks[0].label.toLocaleDateString()),
        );
      });
    });

    this.gameService.reset$
      .pipe(untilDestroyed(this))
      .subscribe(() => this.reset());

    merge(this.options, this.customOptions);
    this.cd.markForCheck();
  }

  ngAfterViewInit() {
    this.pan.init(this.chart);
    this.setScope(this.scopeFormControl.value);

    this.scopeFormControl.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe(level => {
      this.pan.panActive = false;
      this.setScope(level);
      this.cd.markForCheck();
    });

    this.scopeFormControl.updateValueAndValidity();
  }

  setScope(scope?: number) {
    if (this.pan.panActive) return;

    if (scope !== undefined) {
      this.scope = scope;
    }

    let min;
    let max = null;

    if (this.pan.minIndex > 0 && this.scope > 0) {
      [min, max] = this.pan.panLeft();
    } else {
      const index = this.labels.length - this.scope;
      min = this.scope && index > 0 ? this.labels[index] : null;
    }


    this.setXAxisTicks({min, max});
    this.chart?.update();
  }

  setXAxisTicks(options: {
    min?: Label | null,
    max?: Label | null,
  }) {
    const chart = this.chart?.chart as any;
    const chartOptions = chart?.scales['x-axis-0']?.options;
    if (!chartOptions) return;
    chartOptions.ticks = {...chartOptions.ticks, ...options};
  }

  private reset() {
    this.datasets = [];
    this.labels = [];
    this.dataLabelNodes = [];
    this.currentState = 'ok';
    this.seriesLength = 0;
    this.lastValue = undefined;
    this.tooltipLabels = [];
  }

  private getDefaultDataset(color = colors.ok): ChartDataSets {
    return {
      borderColor: `${color}`,
      backgroundColor: `${color}33`,
      pointBorderColor: context => {
        const index = context.dataIndex || 0;
        if (!this.dataLabelNodes[index]?.event) return `${color}`;
        return colors.event.border;
      },
      pointBackgroundColor: context => {
        const index = context.dataIndex || 0;
        if (this.dataLabelNodes[index]?.event) return colors.event.background;
        return `${color}`;
      },
      pointRadius: context => {
        const index = context.dataIndex || 0;
        if (this.dataLabelNodes[index]?.event) return 5;
        if (this.dataLabelNodes[index]?.uiChange) return 4;
        return 0;
      },
      pointBorderWidth: 1,
      pointHitRadius: 5,
    };
  }

  private formatDataLabel(index: number) {
    if (this.dataLabelNodes[index]?.event) {
      const label = this.dataLabelNodes[index]?.event?.choice?.chartLabel;
      return label ? label : null;
    }

    const uiChange = this.dataLabelNodes[index].uiChange;
    if (uiChange) {
      if (uiChange.length > 1) {
        const suffix = uiChange.length < 6 ? 'další' : 'dalších';
        return `${uiChange[0]} (+${uiChange.length - 1} ${suffix})`;
      }

      return uiChange[0];
    }
  }

  private formatTooltip(tooltipItem: ChartTooltipItem[]) {
    this.pan.panAutoReset$.next();
    const dataLabelNode = this.dataLabelNodes[tooltipItem[0].index || 0] || undefined;
    if (!dataLabelNode) return '';

    let title = '';
    if (dataLabelNode.event) {
      const event = dataLabelNode.event;
      title += `Událost: ${event?.originEvent.title}\n`;
      if (event?.choice?.chartLabel) title += `Rozhodnutí: ${event?.choice?.chartLabel}\n`;
    }

    if (dataLabelNode.event && dataLabelNode.uiChange) title += `\n`;
    if (dataLabelNode.uiChange) title += dataLabelNode.uiChange.join('\n');

    return title;
  }
}
