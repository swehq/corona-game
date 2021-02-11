import {AfterViewInit, Component, Input, ViewChild} from '@angular/core';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {TranslateService} from '@ngx-translate/core';
import {ChartDataSets, ChartOptions} from 'chart.js';
import {BaseChartDirective} from 'ng2-charts';
import {ChartI18nKeys, I18nService} from '../../../../services/i18n.service';

@UntilDestroy()
@Component({
  selector: 'cvd-scatter-graph',
  templateUrl: './scatter-graph.component.html',
  styleUrls: ['./scatter-graph.component.scss'],
})
export class ScatterGraphComponent implements AfterViewInit {

  @Input()
  datasets: ChartDataSets[] = [];

  @Input()
  options: ChartOptions = {
    scales: {
      xAxes: [{
        type: 'linear',
        position: 'bottom',
        ticks: {
          callback: (value: number | string) => this.i18nService.formatNumber(+value, false, true),
        },
      }],
      yAxes: [{
        ticks: {
          callback: (value: number | string) => this.i18nService.formatNumber(+value, false, true),
        },
      }],
    },
    plugins: {
      datalabels: {
        display: false,
      },
    },
  };

  @ViewChild(BaseChartDirective, {static: false}) chart!: BaseChartDirective;

  chartI18nKeys: ChartI18nKeys = {};

  constructor(
    private i18nService: I18nService,
    private translateService: TranslateService,
  ) {
  }

  ngAfterViewInit() {
    this.updateChartLabels();
    this.translateService.onLangChange.pipe(
      untilDestroyed(this),
    ).subscribe(
      () => this.updateChartLabels(),
    );
  }

  updateChartLabels() {
    this.i18nService.updateChartLabels(this.chart, this.chartI18nKeys);
    this.chart.chart.update();
  }
}
