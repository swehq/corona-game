import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Game, GameData} from '../services/game';
import {Event} from '../services/events';
import {ReplaySubject, Subject} from 'rxjs';
import {scenarios} from '../services/scenario';
import {DayState} from '../services/simulation';
import {UntilDestroy} from '@ngneat/until-destroy';
import {ActivatedEvent} from './graphs/line-graph/line-graph.component';

export type Speed = 'play' | 'pause' | 'fwd' | 'rev' | 'max' | 'finished';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class GameService {
  readonly PLAY_SPEED = 400; // ms
  readonly FORWARD_SPEED = 0; // ms
  readonly REVERSE_SPEED = 50; // ms

  game!: Game;
  event: Event | undefined;
  tickerId: number | undefined;
  activatedEvent: ActivatedEvent | undefined;

  private speed: Speed | undefined;
  private _speed$ = new Subject<Speed>();
  speed$ = this._speed$.asObservable();

  private _gameState$ = new ReplaySubject<DayState[]>(1);
  gameState$ = this._gameState$.asObservable();

  private _reset$ = new Subject<void>();
  reset$ = this._reset$.asObservable();

  constructor(private httpClient: HttpClient) {
    this.restartSimulation();
  }

  get lastDate() {
    return this.game.simulation.lastDate;
  }

  get modelStates() {
    return this.game.simulation.modelStates;
  }

  restartSimulation(speed: Speed = 'play', scenario: keyof typeof scenarios = 'czechiaGame') {
    this.setSpeed('pause');
    this.game = new Game(scenarios[scenario]);
    this.event = undefined;
    this._reset$.next();
    this.setSpeed(speed);
    this.showEvent(this.game.rampUpEvent);
    this.updateChart();
  }

  /**
   * Update charts according to part of model data
   * @param which what part of the data to take
   *    'last' takes last item
   *    'all' takes all items
   *    number takes right slice of the array beginning with defined index
   */
  private updateChart() {
    this._gameState$.next(this.game.simulation.modelStates);
  }

  togglePause() {
    if (this.speed === 'pause') this.setSpeed('play');
    else this.setSpeed('pause');
  }

  setSpeed(speed: Speed) {
    if (this.speed === speed) return;
    if (this.tickerId) clearInterval(this.tickerId);

    this.speed = speed;
    this._speed$.next(speed);

    if (speed === 'max') {
      while (!this.game.isFinished()) this.tick(false);
      this.updateChart();
      this.setSpeed('pause');
    } else if (speed === 'play') {
      this.tickerId = window.setInterval(() => this.tick(), this.PLAY_SPEED);
    } else if (speed === 'fwd') {
      this.tickerId = window.setInterval(() => this.tick(), this.FORWARD_SPEED);
    } else if (speed === 'rev') {
      this.tickerId = window.setInterval(() => this.tick(), this.REVERSE_SPEED);
    }
  }

  private tick(updateChart = true) {
    if (this.speed === 'rev') {
      if (this.game.canMoveBackward()) {
        this.game.moveBackward();
      } else {
        this.setSpeed('pause');
      }

      return;
    }

    if (this.game.isFinished()) {
      this.save();
      this.setSpeed('finished');
      return;
    }

    const gameUpdate = this.game.moveForward();
    const event = gameUpdate.event;
    this.showEvent(event);

    if (updateChart) this.updateChart();
    this.activatedEvent = undefined;
  }

  private showEvent(event: Event | undefined) {
    if (!event) return;
    if (this.speed === 'max') return;

    this.event = event;
    this.setSpeed('pause');
  }

  getGameData(): GameData {
    return {
      mitigations: {
        history: this.game.mitigationHistory,
        params: this.game.mitigationParams,
      },
      simulation: this.modelStates,
    };
  }

  save() {
    const gameData = this.getGameData();
    this.httpClient.post('/api/game-data', gameData).subscribe();
  }
}
