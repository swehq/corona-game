import {Component, Input, ViewChild} from '@angular/core';
import {ChartDataSets, ChartOptions} from 'chart.js';
import {formatNumber} from '../../../../utils/format';
import {BaseChartDirective} from 'ng2-charts';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'cvd-scatter-graph',
  templateUrl: './scatter-graph.component.html',
  styleUrls: ['./scatter-graph.component.scss'],
})
export class ScatterGraphComponent {

  @Input()
  datasets: ChartDataSets[] = [];

  @Input()
  options: ChartOptions = {
    scales: {
      xAxes: [{
        type: 'linear',
        position: 'bottom',
        ticks: {
          callback(value: number | string) {
            return formatNumber(+value, false, true);
          },
        },
      }],
      yAxes: [{
        ticks: {
          callback(value: number | string) {
            return formatNumber(+value, false, true);
          },
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

  xAxisI18nKey?: string;
  yAxisI18nKey?: string;
  datasetLabelI18nKeys?: string[];

  constructor(private translateService: TranslateService) {}

  ngAfterViewInit() {
    this.updateLabels();
    this.translateService.onLangChange.subscribe(() => this.updateLabels());
  }

  updateLabels() {
    const xAxis = this.chart.chart.options.scales?.xAxes![0];
    if (!this.xAxisI18nKey) {
      this.xAxisI18nKey = xAxis?.scaleLabel?.labelString;
    }
    if (this.xAxisI18nKey) {
      xAxis!.scaleLabel!.labelString = this.translateService.instant(this.xAxisI18nKey);
    }

    const yAxis = this.chart.chart.options.scales?.yAxes![0];
    if (!this.yAxisI18nKey) {
      this.yAxisI18nKey = yAxis?.scaleLabel?.labelString;
    }
    if (this.yAxisI18nKey) {
      yAxis!.scaleLabel!.labelString = this.translateService.instant(this.yAxisI18nKey);
    }

    if (!this.datasetLabelI18nKeys) {
      this.datasetLabelI18nKeys = [];
      this.chart.datasets.forEach(d => this.datasetLabelI18nKeys!.push(d.label!));
    }
    this.datasetLabelI18nKeys.forEach((l, index) => this.chart.datasets[index].label = this.translateService.instant(l));
    this.chart.chart.update();
  }
}
