import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CreditsComponent} from './pages/credits/credits.component';
import {FunctionalityInfoComponent} from './pages/functionality-info/functionality-info.component';
import {GameComponent} from './game/game/game.component';

const routes: Routes = [
  {path: '', component: GameComponent},
  {path:'credits', component: CreditsComponent},
  {path: 'functionality-info', component: FunctionalityInfoComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
