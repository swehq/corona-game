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

  constructor(private translateService: TranslateService) {
    this.translateService.onLangChange.subscribe(() => this.chart.chart.update());
  }
}
