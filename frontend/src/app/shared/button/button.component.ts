import {Component, HostBinding, Input} from '@angular/core';

@Component({
  selector: 'cvd-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
})
export class ButtonComponent {
  @HostBinding('style.--color')
  @Input() color = '';
}
