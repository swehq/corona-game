import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Game, GameData} from '../services/game';
import {Event} from '../services/events';
import {ReplaySubject, Subject} from 'rxjs';
import {scenarios} from '../services/scenario';
import {DayState} from '../services/simulation';
import {UntilDestroy} from '@ngneat/until-destroy';
import {ActivatedEvent} from './graphs/line-graph/line-graph.component';
import {meanBy} from 'lodash';
import {LocalStorageKey} from '../../environments/defaults';

export type Speed = 'play' | 'pause' | 'fwd' | 'rev' | 'max' | 'finished';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class GameService {
  // readonly PLAY_SPEED = 400; // ms
  // readonly FORWARD_SPEED = 0; // ms
  // readonly REVERSE_SPEED = 50; // ms

  game!: Game;
  event: Event | undefined;
  tickerId: number | undefined;
  activatedEvent: ActivatedEvent | undefined;

  private speed: Speed | undefined;
  private speedInterval = 0;
  private _speed$ = new Subject<Speed>();
  speed$ = this._speed$.asObservable();

  private _gameState$ = new ReplaySubject<DayState[]>(1);
  gameState$ = this._gameState$.asObservable();

  private _reset$ = new Subject<void>();
  reset$ = this._reset$.asObservable();

  private _endOfDay$ = new Subject<void>();
  endOfDay$ = this._endOfDay$.asObservable();

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
    this.saveCheckpoint();
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
    if (this.tickerId) {
      window.clearTimeout(this.tickerId);
      this.tickerId = undefined;
    }

    this.speed = speed;
    this._speed$.next(speed);

    if (speed === 'max') {
      while (!this.game.isFinished()) this.tick(false);
      this.updateChart();
      this.setSpeed('pause');
    } else if (speed === 'play') {
      this.scheduleTick();
    } else if (speed === 'fwd') {
      this.scheduleTick(.1);
    } else if (speed === 'rev') {
      this.scheduleTick(-1);
    }
  }

  private scheduleTick(modifier = 1) {
    const speedInterval = [250, 1500];
    const ratioInterval = [1, 2];

    let infectionChange = 1;
    const stats = this.game.simulation.getLastStats();
    if (stats) {
      const infectionMean = meanBy(this.game.simulation.modelStates.slice(-14), 'stats.detectedInfections.today');
      infectionChange = Math.max(
        stats.detectedInfections.today / infectionMean,
        infectionMean / stats.detectedInfections.today);
      infectionChange = Math.sqrt(infectionChange);
      infectionChange = Math.round(infectionChange / .25) * .25;
      // tslint:disable-next-line:no-console
      console.log('change', infectionChange);
    }

    const speed = speedInterval[0] + (speedInterval[1] - speedInterval[0]) *
      (infectionChange - ratioInterval[0]) / (ratioInterval[1] - ratioInterval[0]);

    if (speed > this.speedInterval) this.speedInterval += 100;
    if (speed < this.speedInterval) this.speedInterval -= 100;
    // tslint:disable-next-line:no-console
    console.log('interval', this.speedInterval);

    this.speedInterval = Math.max(speedInterval[0], this.speedInterval);
    this.speedInterval = Math.min(speedInterval[1], this.speedInterval);
    this.tickerId = window.setTimeout(() => {
      this.tick();
      if (this.tickerId) this.scheduleTick();
    }, this.speedInterval * modifier);
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
    if (gameUpdate.dayState.date.endsWith('01')) this.saveCheckpoint();

    this._endOfDay$.next();
    if (updateChart) this.updateChart();
    this.showEvent(gameUpdate.event);
  }

  private showEvent(event: Event | undefined) {
    this.activatedEvent = undefined;

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
    this.httpClient.post('/api/game-data', gameData).subscribe((data: any) => this.saveGameId(data.id));
  }

  private saveGameId(id: string) {
    const storageValue = window.localStorage.getItem(LocalStorageKey.SAVED_GAME_IDS);
    let ids = [];

    if (storageValue) ids = JSON.parse(storageValue);

    ids.push(id);
    window.localStorage.setItem(LocalStorageKey.SAVED_GAME_IDS, JSON.stringify(ids));
  }

  private saveCheckpoint() {
    window.localStorage.setItem(LocalStorageKey.LAST_GAME_DATA, JSON.stringify(this.getGameData()));
  }

  // private loadGame() {
  //   const dataString = window.localStorage.getItem(LocalStorageKey.LAST_GAME_DATA);
  //   if (dataString) validateGame(JSON.parse(dataString));
  // }
}
