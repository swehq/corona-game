import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {ChartsModule} from 'ng2-charts';
import {SharedModule} from '../shared/shared.module';
import {GameMaterialModule} from './game-material.module';
import {GameComponent} from './game/game.component';
import {GraphSizeDirective} from './graphs/graph-size.directive';
import {GraphsComponent} from './graphs/graphs.component';
import {LineGraphComponent} from './graphs/line-graph/line-graph.component';
import {ScatterGraphComponent} from './graphs/scatter-graph/scatter-graph.component';
import {MitigationBoolComponent} from './mitigations-control/controls/mitigation-bool.component';
import {MitigationScaleComponent} from './mitigations-control/controls/mitigation-scale.component';
import {MitigationSlideComponent} from './mitigations-control/controls/mitigation-slide.component';
import {MitigationToggleComponent} from './mitigations-control/controls/mitigation-toggle.component';
import {MitigationConfigDirective} from './mitigations-control/mitigation-config.directive';
import {MitigationsControlComponent} from './mitigations-control/mitigations-control.component';
import {NewsComponent} from './news/news.component';
import {SimulationControlComponent} from './simulation-control/simulation-control.component';
import {StatusDisplayComponent} from './status-display/status-display.component';

@NgModule({
  declarations: [
    GameComponent,
    GraphsComponent,
    GraphSizeDirective,
    LineGraphComponent,
    MitigationBoolComponent,
    MitigationConfigDirective,
    MitigationScaleComponent,
    MitigationsControlComponent,
    MitigationSlideComponent,
    MitigationToggleComponent,
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
