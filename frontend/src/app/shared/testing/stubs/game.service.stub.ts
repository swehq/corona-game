import {Injectable} from '@angular/core';
import {Game} from '../../../services/game';
import {scenarios} from '../../../services/scenario';
import {of} from 'rxjs';

@Injectable()
export class GameServiceStub {
  game = new Game(scenarios.czechiaGame);
  gameState$ = of(this.game.simulation.modelStates);
  endOfDay$ = of();
  reset$ = of();
  speed$ = of('auto');
  setSpeed = () => true;
}
