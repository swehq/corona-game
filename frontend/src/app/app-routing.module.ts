import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AboutComponent} from './game/about/about.component';
import {CreditsComponent} from './game/credits/credits.component';
import {GameComponent} from './game/game/game.component';
import {OutroComponent} from './game/outro/outro.component';

const routes: Routes = [
  {path: '', component: GameComponent},
  {path: 'game', component: OutroComponent},
  {path: 'game/:id', component: OutroComponent},
  {path: 'credits', component: CreditsComponent},
  {path: 'about', component: AboutComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
