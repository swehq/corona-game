import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {ChartsModule} from 'ng2-charts';
import {SharedModule} from '../shared/shared.module';
import {EventsLayoutComponent} from './components/events-layout/events-layout.component';
import {GraphsComponent} from './components/graphs/graphs.component';
import {LineGraphComponent} from './components/graphs/line-graph/line-graph.component';
import {ScatterGraphComponent} from './components/graphs/scatter-graph/scatter-graph.component';
import {MitigationBoolComponent} from './components/mitigations-control/controls/mitigation-bool.component';
import {MitigationScaleComponent} from './components/mitigations-control/controls/mitigation-scale.component';
import {MitigationSlideComponent} from './components/mitigations-control/controls/mitigation-slide.component';
import {MitigationToggleComponent} from './components/mitigations-control/controls/mitigation-toggle.component';
import {MitigationConfigDirective} from './components/mitigations-control/mitigation-config.directive';
import {MitigationsControlComponent} from './components/mitigations-control/mitigations-control.component';
import {SimulationControlComponent} from './components/simulation-control/simulation-control.component';
import {SpeedControlComponent} from './components/speed-control/speed-control.component';
import {StatusDisplayComponent} from './components/status-display/status-display.component';
import {GameMaterialModule} from './game-material.module';
import {AboutComponent} from './pages/about/about.component';
import {CreditsComponent} from './pages/credits/credits.component';
import {GameComponent} from './pages/game/game.component';
import {IntroComponent} from './pages/intro/intro.component';
import {OutroComponent} from './pages/outro/outro.component';

@NgModule({
  declarations: [
    AboutComponent,
    EventsLayoutComponent,
    CreditsComponent,
    GameComponent,
    GraphsComponent,
    IntroComponent,
    LineGraphComponent,
    MitigationBoolComponent,
    MitigationConfigDirective,
    MitigationScaleComponent,
    MitigationsControlComponent,
    MitigationSlideComponent,
    MitigationToggleComponent,
    OutroComponent,
    ScatterGraphComponent,
    SimulationControlComponent,
    SpeedControlComponent,
    StatusDisplayComponent,
  ],
  imports: [
    ChartsModule,
    CommonModule,
    GameMaterialModule,
    ReactiveFormsModule,
    RouterModule,
    SharedModule,
  ],
  exports: [
    GameComponent,
  ],
})
export class GameModule {
}
