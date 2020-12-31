import {BreakpointObserver} from '@angular/cdk/layout';
import {DOCUMENT} from '@angular/common';
import {ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit, Renderer2} from '@angular/core';
import {Subject} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';
import {ConfigService} from './services/config.service';

@Component({
  selector: 'cvd-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();

  constructor(
    private configService: ConfigService,
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private breakpointObserver: BreakpointObserver,
  ) {
  }

  ngOnInit() {
    const {body} = this.document;

    this.renderer.addClass(body, 'mat-app-background');

    const markBodyWithClass = (className: string) => (mark: boolean | undefined) => {
      if (mark) {
        this.renderer.addClass(body, className);
      } else {
        this.renderer.removeClass(body, className);
      }
    };

    this.configService.config$.pipe(
      map(config => config.themeIsLight),
      takeUntil(this.destroyed),
    ).subscribe(
      markBodyWithClass('theme-alternate'),
    );

    this.breakpointObserver.observe(['only screen and (min-width: 768px)']).pipe(
      map(state => state.matches),
      takeUntil(this.destroyed),
    ).subscribe(
      markBodyWithClass('media-wide'),
    );
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }
}
