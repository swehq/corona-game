import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {SharedModule} from '../shared/shared.module';
import {ChartComponent} from './chart/chart.component';
import {ChartsComponent} from './charts/charts.component';
import {ControlPanelComponent} from './control-panel/control-panel.component';
import {GameComponent} from './game/game.component';

@NgModule({
  declarations: [
    ChartComponent,
    ChartsComponent,
    ControlPanelComponent,
    GameComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
  ],
  exports: [
    GameComponent,
  ]
})
export class GameModule {
}
