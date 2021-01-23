import {Injectable} from '@angular/core';
import {Game} from '../../../services/game';
import {of} from 'rxjs';

@Injectable()
export class GameServiceStub {
  game = new Game('czechiaGame');
  gameState$ = of(this.game.simulation.modelStates);
  endOfDay$ = of();
  reset$ = of();
  speed$ = of('auto');
  setSpeed = () => true;
  isLocalStorageGame = () => false;
}
