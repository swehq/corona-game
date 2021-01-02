import {NgModule} from '@angular/core';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSliderModule} from '@angular/material/slider';
import {MatTabsModule} from '@angular/material/tabs';

@NgModule({
  exports: [
    MatSliderModule,
    MatSlideToggleModule,
    MatTabsModule,
  ],
})
export class GameMaterialModule {
}
