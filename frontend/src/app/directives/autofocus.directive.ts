import {AfterViewInit, Directive, ElementRef, Input} from '@angular/core';

@Directive({
  // tslint:disable-next-line: directive-selector
  selector: '[cvdAutofocus]',
})
export class AutofocusDirective implements AfterViewInit {
  @Input()
  cvdAutofocus = true;

  constructor(private host: ElementRef) {}

  ngAfterViewInit() {
    if (this.cvdAutofocus) this.host.nativeElement.focus({preventScroll: true});
  }
}
