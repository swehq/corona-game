import {Location} from '@angular/common';
import {Directive, HostListener} from '@angular/core';

@Directive({
  selector: '[cvdNavigateBack]',
})
export class NavigateBackDirective {

  @HostListener('click')
  onClick() {
    this.location.back();
  }

  constructor(
    private location: Location,
  ) {
  }
}
