import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NgModule} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {RouterTestingModule} from '@angular/router/testing';
import {TranslateFakeLoader, TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {GameService} from '../../game/game.service';
import {GameServiceStub} from './stubs/game.service.stub';
import {GameModule} from '../../game/game.module';

@NgModule({
  imports: [
    HttpClientTestingModule,
    NoopAnimationsModule,
    RouterTestingModule,
    GameModule,
    TranslateModule.forRoot({
      loader: {provide: TranslateLoader, useClass: TranslateFakeLoader},
    }),
  ],
  exports: [
    HttpClientTestingModule,
    NoopAnimationsModule,
    RouterTestingModule,
    GameModule,
  ],
  providers: [
    {provide: GameService, useClass: GameServiceStub},
  ],
})
export class TestingModule {
}
