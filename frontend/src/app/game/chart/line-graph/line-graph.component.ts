import {Component, Input, OnInit} from '@angular/core';
import {ChartDataSets, ChartOptions} from 'chart.js';
import {Label, PluginServiceGlobalRegistrationAndOptions, SingleDataSet} from 'ng2-charts';
import * as ChartDataLabels from 'chartjs-plugin-datalabels';

export type NodeEvent = 'Zavření škol' | 'Otevření škol' | 'Zákaz všeho' | undefined;

export interface LineNode {
  value: number;
  event?: NodeEvent;
}

@Component({
  selector: 'app-line-graph',
  templateUrl: './line-graph.component.html',
  styleUrls: ['./line-graph.component.scss']
})
export class LineGraphComponent implements OnInit {

  @Input()
  title: string;

  @Input()
  set setData(data: LineNode[]) {
    const today = new Date();

    this.labels = data.map((node, index) => {
      today.setDate(today.getDate() + index);
      return today.toLocaleDateString();
    });

    this.eventNodes = data.map(node => node.event);
    this.data = data.map(node => node.value);
    this.datasets[0].data = this.data;
  }

  data: SingleDataSet;
  eventNodes: NodeEvent[] = [];
  datasets: ChartDataSets[] = [{
    data: [],
    pointRadius: context => Boolean(this.eventNodes[context.dataIndex]) ? 4 : 1,
    pointHitRadius: 5
  }];

  labels: Label[];

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
        title: tooltipItem => this.eventNodes[tooltipItem[0].index],
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
    },
  };
  plugins = [ChartDataLabels] as PluginServiceGlobalRegistrationAndOptions[];

  ngOnInit() {
    this.options.title = {
      text: this.title,
      display: Boolean(this.title),
    };
  }
}
