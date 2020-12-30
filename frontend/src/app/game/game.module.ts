import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {ChartsModule} from 'ng2-charts';
import {SharedModule} from '../shared/shared.module';
import {ChartComponent} from './chart/chart.component';
import {LineGraphComponent} from './chart/line-graph/line-graph.component';
import {ScatterGraphComponent} from './chart/scatter-graph/scatter-graph.component';
import {GameMaterialModule} from './game-material.module';
import {GameComponent} from './game/game.component';
import {MitigationBoolComponent} from './mitigations-control/controls/mitigation-bool.component';
import {MitigationScaleComponent} from './mitigations-control/controls/mitigation-scale.component';
import {MitigationConfigDirective} from './mitigations-control/mitigation-config.directive';
import {MitigationsControlComponent} from './mitigations-control/mitigations-control.component';
import {NewsComponent} from './news/news.component';
import {SimulationControlComponent} from './simulation-control/simulation-control.component';
import {StatusDisplayComponent} from './status-display/status-display.component';

@NgModule({
  declarations: [
    ChartComponent,
    GameComponent,
    LineGraphComponent,
    MitigationBoolComponent,
    MitigationConfigDirective,
    MitigationScaleComponent,
    MitigationsControlComponent,
    NewsComponent,
    ScatterGraphComponent,
    SimulationControlComponent,
    StatusDisplayComponent,
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
  ],
})
export class GameModule {
}
