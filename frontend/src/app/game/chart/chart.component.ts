import {Component, Input} from '@angular/core';

export interface Serie {
  label: string;
  color?: string;
  unit?: string;
}
@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent {
  @Input()
  series: Serie[];
}
