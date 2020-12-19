import {Directive, HostBinding, Input} from '@angular/core';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[flexItem],[grow],[shrink],[basis]',
})
export class FlexItemDirective {

  @Input() set grow(value: number | '') { this._grow = value === '' ? 1 : value; }
  get grow() { return this._grow; }
  _grow = 0;

  @Input() set shrink(value: number | '') { this._shrink = value === '' ? 1 : value; }
  get shrink() { return this._shrink; }
  _shrink = 1;

  @Input() set basis(value: string | '') { this._basis = value === '' ? '20%' : value; }
  get basis() { return this._basis; }
  _basis = '0%'; // default basis 0% is patch for IE

  @HostBinding('style.flex')
  get flex() {
    return `${this.grow} ${this.shrink} ${this.basis}`;
  }
}
