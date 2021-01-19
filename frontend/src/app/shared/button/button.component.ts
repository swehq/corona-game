import {Component, HostBinding, HostListener, Input, ViewChild} from '@angular/core';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'cvd-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
})
export class ButtonComponent {
  @Input()
  type: 'raised' | 'stroked' = 'stroked';

  @HostBinding('style.--color')
  @Input() color = '';

  @ViewChild('nativeButtonElement')
  _nativeButtonElement: MatButton | undefined;

  @HostBinding('tabindex')
  setTabIndex() {
    return '-1';
  }

  @HostListener('focus')
  onFocus() {
    if (this._nativeButtonElement) {
      this._nativeButtonElement.focus(null, {preventScroll: true});
    }
  }
}
