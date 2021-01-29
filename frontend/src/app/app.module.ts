import {registerLocaleData} from '@angular/common';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import cs from '@angular/common/locales/cs';
import {APP_INITIALIZER, NgModule} from '@angular/core';
import {MatChipsModule} from '@angular/material/chips';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {GameModule} from './game/game.module';
import {DebugModeService} from './services/debug-mode.service';
import {CvdLoaderFactory, loadTranslations} from './services/translate-loader';
import {SharedModule} from './shared/shared.module';

registerLocaleData(cs);

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    MatChipsModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    SharedModule,
    GameModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: CvdLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: loadTranslations,
      deps: [
        TranslateService,
        DebugModeService,
      ],
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
