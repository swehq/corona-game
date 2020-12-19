import {Component} from '@angular/core';
import {RowComponent} from './row.component';

@Component({
  selector: 'cvd-col',
  templateUrl: './row.component.html',
  styleUrls: ['./row.component.scss'],
})
export class ColComponent extends RowComponent {
  get isColumn() { return true; }

  constructor() {
    super();
    this.spacing = 0;
  }
}
