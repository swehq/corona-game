import {Component} from '@angular/core';
import {RowComponent} from './row.component';

@Component({
  selector: 'app-row-group',
  templateUrl: './row.component.html',
  styleUrls: ['./row.component.scss'],
})
export class RowGroupComponent extends RowComponent {
  constructor() {
    super();
    this.wrap = false;
    this.spacing = 0;
  }
}
