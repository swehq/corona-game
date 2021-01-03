import {NgModule} from '@angular/core';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSliderModule} from '@angular/material/slider';
import {MatTabsModule} from '@angular/material/tabs';

@NgModule({
  exports: [
    MatButtonToggleModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatTabsModule,
  ],
})
export class GameMaterialModule {
}
