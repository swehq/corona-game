import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AboutComponent} from './game/pages/about/about.component';
import {CreditsComponent} from './game/pages/credits/credits.component';
import {CanActivateGame} from './game/pages/game/can-activate-game';
import {CanDeactivateGame} from './game/pages/game/can-deactivate-game';
import {GameComponent} from './game/pages/game/game.component';
import {IntroComponent} from './game/pages/intro/intro.component';
import {OutroComponent} from './game/pages/outro/outro.component';

const routes: Routes = [
  {path: '', component: IntroComponent},
  {path: 'intro', component: IntroComponent},
  {path: 'game', component: GameComponent, canActivate: [CanActivateGame], canDeactivate: [CanDeactivateGame]},
  {path: 'results', component: OutroComponent},
  {path: 'results/:id', component: OutroComponent},
  {path: 'credits', component: CreditsComponent},
  {path: 'about', component: AboutComponent},
  {path: '**', redirectTo: '/'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {scrollPositionRestoration: 'top'})],
  exports: [RouterModule],
  providers: [CanDeactivateGame, CanActivateGame],
})
export class AppRoutingModule {
}
