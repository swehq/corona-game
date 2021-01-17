import {ChangeDetectionStrategy, Component, HostBinding, Input} from '@angular/core';

@Component({
  selector: 'cvd-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  @Input()
  compactMode: null | boolean = false;

  @HostBinding('class.is-compact')
  get compactClass() {
    return this.compactMode === true;
  }
}
