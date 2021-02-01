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
import {TranslateService} from '@ngx-translate/core';
import {ApplicationLanguage} from '../../../../services/translate-loader';
import {formatNumber} from '../../../../utils/format';
import {GameService} from '../../../game.service';
import {Level} from '../../mitigations-control/controls/mitigation-scale.component';
import {Pan} from './pan';
import {EventAndChoice} from '../../../../services/events';
import {formatDate} from 'src/app/utils/format-date';
import {marker as _} from '@biesbjerg/ngx-translate-extract-marker';

export type NodeState = 'ok' | 'warn' | 'critical' | undefined;

export interface ChartValue {
  label: string | Date;
  value: number;
  tooltipLabel: (value: number) => string;
  datasetOptions?: ChartDataSets;
  color?: string;
  state?: NodeState;
}

export interface DataLabelNode {
  uiChange: string[] | undefined;
  event: EventAndChoice | undefined;
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
    [0, _('Celý graf')],
    [90, _('Kvartál')],
    [30, _('Měsíc')],
  ];

  private currentState: NodeState = 'ok';
  private tooltipLabels: ((value: number) => string)[] = [];
  private seriesLength = 0;
  private lastValue: number | undefined;

  private axesFontSize = 11;
  private readonly widthThresholds = {
    phone: 500,
    tablet: 960,
  };

  @Input()
  scopeFormControl = new FormControl(0);

  scope = 0;
  datasets: ChartDataSets[] = [];
  labels: Label[] = [];
  options: ChartOptions = {
    layout: {
      padding: {
        top: 32,
      },
    },
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
      titleFontSize: 11,
      bodyFontSize: 11,
      callbacks: {
        title: tooltipItem => this.formatTooltip(tooltipItem),
        label: tooltipItem => this.tooltipLabels[tooltipItem.datasetIndex!](+tooltipItem.yLabel!),
      },
    },
    scales: {
      yAxes: [{
        ticks: {
          fontSize: this.axesFontSize,
          callback: value => formatNumber(+value, false, true),
        },
      }],
      xAxes: [{
        ticks: {
          maxRotation: 0,
          autoSkipPadding: 16,
          fontSize: this.axesFontSize,
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
          let size = Math.round(width! / 52);
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

  constructor(public cd: ChangeDetectorRef, public gameService: GameService,
    private translateService: TranslateService) {
    this.pan = new Pan(this);

    this.translateService.onLangChange.subscribe(() => this.chart.chart.update());
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
        this.labels.push(typeof tick.label === 'string' ? tick.label : formatDate(tick.label));
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
          : formatDate(ticks[0].label)),
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

        let pointRadius = 0;
        if (this.dataLabelNodes[index]?.event) pointRadius = 5;
        if (this.dataLabelNodes[index]?.uiChange) pointRadius = 4;

        if (!pointRadius) return 0;

        if (context.chart?.width! < this.widthThresholds.phone) pointRadius -= 2;

        return pointRadius;
      },
      pointBorderWidth: 1,
      pointHitRadius: 5,
      borderWidth: context => {
        if (context.chart?.width! < this.widthThresholds.phone) return 1;
        if (context.chart?.width! < this.widthThresholds.tablet) return 2;
        return 3;
      },
    };
  }

  private formatDataLabel(index: number) {
    if (this.dataLabelNodes[index]?.event) {
      const label = this.dataLabelNodes[index]?.event?.choice?.chartLabel;
      return label ? this.translateService.instant(label) : null;
    }

    const uiChange = this.dataLabelNodes[index].uiChange;
    if (uiChange) {
      if (uiChange.length > 1) {
        if (this.translateService.currentLang === ApplicationLanguage.CZECH && uiChange.length >= 6) {
          return `${uiChange[0]} (+${uiChange.length - 1} dalších)`;
        } else {
          return this.translateService.instant(_('{{first}} (+{{numMore}} další)'),
            {first: this.translateService.instant(uiChange[0]), numMore: uiChange.length - 1});
        }
      }

      return this.translateService.instant(uiChange[0]);
    }
  }

  private formatTooltip(tooltipItem: ChartTooltipItem[]) {
    this.pan.panAutoReset$.next();
    const dataLabelNode = this.dataLabelNodes[tooltipItem[0].index || 0] || undefined;
    if (!dataLabelNode) return '';

    let title = `${tooltipItem[0].xLabel}\n`;
    if (dataLabelNode.event) {
      const event = dataLabelNode.event;
      title += this.translateService.instant(_('Událost')) + ': '
        + this.translateService.instant(event?.event.title) + '\n'; // i18n TODO: interpolate
      if (event?.choice?.chartLabel) {
        title += this.translateService.instant(_('Rozhodnutí')) + ': '
          + this.translateService.instant(event?.choice?.chartLabel) + '\n';
      }
    }

    if (dataLabelNode.event && dataLabelNode.uiChange) title += `\n`;
    if (dataLabelNode.uiChange) {
      title += dataLabelNode.uiChange.map(c => this.translateService.instant(c)).join('\n') + '\n';
    }

    return title;
  }
}
