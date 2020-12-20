import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {ChartDataSets, ChartOptions} from 'chart.js';
import {BaseChartDirective, Label, PluginServiceGlobalRegistrationAndOptions, SingleDataSet} from 'ng2-charts';
import * as ChartDataLabels from 'chartjs-plugin-datalabels';
import 'chartjs-plugin-zoom';

export type NodeEvent = 'Zavření škol' | 'Otevření škol' | 'Zákaz všeho' | undefined;

export interface LineNode {
  value: number;
  event?: NodeEvent;
}

@Component({
  selector: 'cvd-line-graph',
  templateUrl: './line-graph.component.html',
  styleUrls: ['./line-graph.component.scss']
})
export class LineGraphComponent implements OnInit {
  @Input() title = '';

  @Input()
  set setData(data: LineNode[]) {
    if (!data) return;

    const today = new Date();
    this.labels = data.map((_, index) => {
      today.setDate(today.getDate() + index);
      return today.toLocaleDateString();
    });

    this.eventNodes = data.map(node => node.event);
    this.datasets[0].data = data.map(node => node.value);
  }

  @ViewChild(BaseChartDirective, {static: false}) chart!: BaseChartDirective;

  eventNodes: NodeEvent[] = [];
  datasets: ChartDataSets[] = [{
    data: [],
    pointRadius: context => context.dataIndex && this.eventNodes[context.dataIndex] ? 4 : 1,
    pointHitRadius: 5
  }];

  labels: Label[] = [];

  font = {
    family: '"worksans", "Helvetica Neue", arial',
    size: 11,
    weight: 600,
  };

  options: ChartOptions = {
    title: {
      display: false,
      text: undefined,
    },
    legend: {
      display: false,
    },
    responsive: true,
    tooltips: {
      enabled: true,
      displayColors: false,
      callbacks: {
        label: tooltipItem => `Počet nakažených: ${tooltipItem?.value?.toString()}`,
        title: tooltipItem => (tooltipItem[0].index && this.eventNodes[tooltipItem[0].index]) || '',
      },
    },
    plugins: {
      datalabels: {
        anchor: 'center',
        clamp: true,
        align: 'end',
        offset: 5,
        textAlign: 'center',
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
        },
        zoom: {
          enabled: true,
          speed: 1,
          mode: 'x',
        }
      }
    },
  };
  plugins = [ChartDataLabels] as PluginServiceGlobalRegistrationAndOptions[];

  ngOnInit() {
    this.options.title = {
      text: this.title,
      display: Boolean(this.title),
    };
  }

  resetZoom() {
    (this.chart.chart as any).resetZoom();
  }
}
