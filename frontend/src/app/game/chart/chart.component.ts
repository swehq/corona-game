import {Component, Input} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {LineNode, NodeEvent} from './line-graph/line-graph.component';

export interface Serie {
  label: string;
  color?: string;
  unit?: string;
}

@Component({
  selector: 'cvd-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent {
  @Input()
  series: Serie[];

  // MOCK DATA

  data$ = new BehaviorSubject<LineNode[]>([
    {
      value: 86
    },
    {
      value: 114
    },
    {
      value: 106
    },
    {
      value: 107
    },
    {
      value: 109
    },
    {
      value: 111
    },
    {
      value: 133,
      event: 'Otevření škol',
    },
    {
      value: 230
    },
    {
      value: 600
    },
    {
      value: 1700
    },
  ]);


  addData(event: NodeEvent) {
    const currentData: LineNode[] = this.data$.value;
    const randomNumber = Math.floor(Math.random() * 500);
    const upOrDown = Boolean(randomNumber % 2) ? 1 : -1;
    const newNode = currentData[currentData.length - 1].value + upOrDown * randomNumber;
    this.data$.next([...currentData, {value: newNode, event}]);
  }

  removeData() {
    const currentData = this.data$.value;
    currentData.pop();
    this.data$.next([...currentData]);
  }
}
