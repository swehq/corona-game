import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AboutComponent} from './game/about/about.component';
import {CreditsComponent} from './game/credits/credits.component';
import {CanDeactivateGame} from './game/game/can-deactivate-game';
import {GameComponent} from './game/game/game.component';
import {IntroComponent} from './game/intro/intro.component';
import {OutroComponent} from './game/outro/outro.component';

const routes: Routes = [
  {path: '', component: IntroComponent},
  {path: 'intro', component: IntroComponent},
  {path: 'game', component: GameComponent, canDeactivate: [CanDeactivateGame]},
  {path: 'results', component: OutroComponent},
  {path: 'results/:id', component: OutroComponent},
  {path: 'credits', component: CreditsComponent},
  {path: 'about', component: AboutComponent},
  {path: '**', redirectTo: '/'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [CanDeactivateGame],
})
export class AppRoutingModule {
}
