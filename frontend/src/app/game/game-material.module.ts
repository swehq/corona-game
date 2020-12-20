import {NgModule} from '@angular/core';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';

@NgModule({
  exports: [
    MatButtonToggleModule,
    MatSlideToggleModule,
  ],
})
export class GameMaterialModule {
}
