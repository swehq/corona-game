import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {ChartsModule} from 'ng2-charts';
import {SharedModule} from '../shared/shared.module';
import {ChartComponent} from './chart/chart.component';
import {LineGraphComponent} from './chart/line-graph/line-graph.component';
import {ScatterGraphComponent} from './chart/scatter-graph/scatter-graph.component';
import {ChartsComponent} from './charts/charts.component';
import {GameMaterialModule} from './game-material.module';
import {GameComponent} from './game/game.component';
import {MeasureBoolComponent} from './measures-control/controls/measure-bool.component';
import {MeasureToggleComponent} from './measures-control/controls/measure-toggle.component';
import {MeasureDirective} from './measures-control/measure.directive';
import {MeasuresControlComponent} from './measures-control/measures-control.component';
import {SimulationControlComponent} from './simulation-control/simulation-control.component';
import {StatusDisplayComponent} from './status-display/status-display.component';

@NgModule({
  declarations: [
    ChartComponent,
    ChartsComponent,
    GameComponent,
    LineGraphComponent,
    MeasureBoolComponent,
    MeasuresControlComponent,
    MeasureToggleComponent,
    ScatterGraphComponent,
    SimulationControlComponent,
    StatusDisplayComponent,
    MeasureDirective,
  ],
  imports: [
    ChartsModule,
    CommonModule,
    GameMaterialModule,
    ReactiveFormsModule,
    SharedModule,
  ],
  exports: [
    GameComponent,
  ]
})
export class GameModule {
}
