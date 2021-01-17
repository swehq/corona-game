import {Component, Input} from '@angular/core';
import {ChartDataSets, ChartOptions} from 'chart.js';
import {formatNumber} from '../../../../utils/format';

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
}
