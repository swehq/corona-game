import {BreakpointObserver} from '@angular/cdk/layout';
import {Directive, ElementRef, Renderer2, Self} from '@angular/core';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {combineLatest, fromEvent} from 'rxjs';
import {debounceTime, map, startWith} from 'rxjs/operators';

@UntilDestroy()
@Directive({
  // tslint:disable-next-line:directive-selector
  selector: 'canvas[baseChart]',
})
export class GraphSizeDirective {

  windowReSize$ = fromEvent(window, 'resize').pipe(
    map(event => event.target! as Window),
    map(window => ({
      width: window.innerWidth,
      height: window.innerHeight,
    })),
    debounceTime(50),
  );

  isWide$ = this.breakpointObserver.observe(['only screen and (min-width: 900px)']).pipe(
    map(state => state.matches),
  );

  constructor(
    @Self() self: ElementRef,
    private breakpointObserver: BreakpointObserver,
    renderer: Renderer2,
  ) {
    const canvas = self.nativeElement;

    combineLatest([
      this.windowReSize$.pipe(
        startWith({
          width: window.innerWidth,
          height: window.innerHeight,
        }),
      ),
      this.isWide$,
    ]).pipe(
      untilDestroyed(this),
    ).subscribe(
      ([windowSize, isWide]) => {
        let {width, height} = windowSize;
        const k = isWide ? .43 : .82;

        width = Math.floor(width * k);
        height = Math.floor(width * 0.75);

        renderer.setStyle(canvas, 'width', width + 'px');
        renderer.setStyle(canvas, 'height', height + 'px');
      },
    );
  }

}
