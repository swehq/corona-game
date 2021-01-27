import {DOCUMENT} from '@angular/common';
import {ChangeDetectionStrategy, Component, Inject, Renderer2} from '@angular/core';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {map} from 'rxjs/operators';
import {ConfigService} from './services/config.service';
import {RouterUtilsService} from './services/router-utils.service';

@UntilDestroy()
@Component({
  selector: 'cvd-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {

  constructor(
    configService: ConfigService,
    @Inject(DOCUMENT) document: Document,
    renderer: Renderer2,
    public routerUtils: RouterUtilsService,
  ) {
    const {body} = document;

    renderer.addClass(body, 'mat-app-background');

    configService.config$.pipe(
      map(config => config.themeIsLight),
      untilDestroyed(this),
    ).subscribe(
      isLightTheme => {
        if (isLightTheme) {
          renderer.addClass(body, 'theme-alternate');
        } else {
          renderer.removeClass(body, 'theme-alternate');
        }
      },
    );
  }
}
