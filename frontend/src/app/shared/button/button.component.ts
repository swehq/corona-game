import {Component, Input} from '@angular/core';

@Component({
  selector: 'cvd-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent {
  @Input() color = '';
}
