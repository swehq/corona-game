import {registerLocaleData} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {MatChipsModule} from '@angular/material/chips';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {GameModule} from './game/game.module';
import {SharedModule} from './shared/shared.module';
import cs from '@angular/common/locales/cs';

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
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
