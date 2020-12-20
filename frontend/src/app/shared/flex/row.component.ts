import {Component, HostBinding, Input} from '@angular/core';

type Spacing = 0 | 4 | 8 | 16 | 24 | 32 | 64 | 128;
export type Orientation = 'row' | 'col';

@Component({
  selector: 'cvd-row',
  templateUrl: './row.component.html',
  styleUrls: ['./row.component.scss'],
})
export class RowComponent {
  @Input() spacing: Spacing = 16;
  @Input() horizontalSpacing: Spacing = 0;
  @Input() verticalSpacing: Spacing = 0;

  @Input()
  set wrap(value: boolean | '') { this._wrap = value === '' ? true : value; }
  get wrap() { return this._wrap; }
  private _wrap = false;

  @Input() alignItems: 'start' | 'center' | 'baseline' | 'end' = 'center';
  @Input() justifyContent: 'flex-start' | 'center' | 'space-between' | 'space-around' | 'flex-end' = 'center';
  @HostBinding('style.overflow') @Input() overflow: 'unset' | 'hidden' | 'auto' = 'auto';

  @Input()
  set reversed(value: boolean | '') { this._reversed = value === '' ? true : value; }
  get reversed() { return this._reversed; }
  private _reversed = false;

  get verticalGap() {
    return this.verticalSpacing || this.spacing || 0;
  }

  get horizontalGap() {
    return this.horizontalSpacing || this.spacing || 0;
  }

  get mainAxeGap() {
    return this.isColumn ? this.verticalGap : this.horizontalGap;
  }

  get isWrapping() {
    return this.wrap || (this.wrap as any) === '';
  }

  get isColumn() {
    return false;
  }

  get orientation(): Orientation {
    return this.isColumn ? 'col' : 'row';
  }

  get isReversed() {
    return this.reversed || (this.reversed as any) === '';
  }

  get spacingClass() {
    return `container-spacing-${this.verticalGap}-${this.horizontalGap} container-${this.orientation}`;
  }
}
