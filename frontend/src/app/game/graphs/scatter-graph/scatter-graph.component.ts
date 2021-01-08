import {Component, Input} from '@angular/core';
import {ChartDataSets, ChartOptions} from 'chart.js';
import {formatNumber} from '../../../utils/format';

@Component({
  selector: 'cvd-scatter-graph',
  templateUrl: './scatter-graph.component.html',
  styleUrls: ['./scatter-graph.component.scss'],
})
export class ScatterGraphComponent {

  @Input()
  datasets: ChartDataSets[] = [{
    label: 'Scatter Dataset',
    data: [{
      x: -10,
      y: 0,
    }, {
      x: 0,
      y: 10,
    }, {
      x: 10,
      y: 5,
    }],
  }];

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
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
          speed: 2,
        },
      },
    },
  };
}
