import {DOCUMENT} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {ChangeDetectionStrategy, Component, Inject, OnDestroy, Renderer2} from '@angular/core';
import {Subject} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';
import {ConfigService} from './services/config.service';

@Component({
  selector: 'cvd-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnDestroy {

  private destroyed = new Subject();

  constructor(
    configService: ConfigService,
    @Inject(DOCUMENT) document: Document,
    renderer: Renderer2,
    httpClient: HttpClient,
  ) {
    const {body} = document;

    renderer.addClass(body, 'mat-app-background');

    configService.config$.pipe(
      map(config => config.themeIsLight),
      takeUntil(this.destroyed),
    ).subscribe(
      isLightTheme => {
        if (isLightTheme) {
          renderer.addClass(body, 'theme-alternate');
        } else {
          renderer.removeClass(body, 'theme-alternate');
        }
      },
    );

    // tslint:disable-next-line:no-console
    httpClient.get('/api/todo').subscribe(value => console.log(value));
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }
}
