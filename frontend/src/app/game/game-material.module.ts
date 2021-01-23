import {NgModule} from '@angular/core';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatChipsModule} from '@angular/material/chips';
import {MatDividerModule} from '@angular/material/divider';
import {MatRippleModule} from '@angular/material/core';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSliderModule} from '@angular/material/slider';
import {MatTabsModule} from '@angular/material/tabs';
import {MatTooltipModule} from '@angular/material/tooltip';

@NgModule({
  exports: [
    MatButtonToggleModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatRippleModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatTooltipModule,
  ],
})
export class GameMaterialModule {
}
