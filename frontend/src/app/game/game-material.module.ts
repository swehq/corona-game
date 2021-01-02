import {NgModule} from '@angular/core';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSliderModule} from '@angular/material/slider';

@NgModule({
  exports: [
    MatSliderModule,
    MatSlideToggleModule,
  ],
})
export class GameMaterialModule {
}
