import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Game, GameData} from '../services/game';
import {Event} from '../services/events';
import {ReplaySubject, Subject} from 'rxjs';
import {scenarios} from '../services/scenario';
import {DayState} from '../services/simulation';
import {UntilDestroy} from '@ngneat/until-destroy';
import {meanBy} from 'lodash';
import {LocalStorageKey} from '../../environments/defaults';
import {validateGame} from '../services/validate';
import {tap} from 'rxjs/operators';

export type Speed = 'play' | 'auto' | 'pause' | 'fwd' | 'rev' | 'max' | 'finished';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class GameService {
  readonly PLAY_SPEED = 400; // ms
  readonly FAST_SPEED = 0; // ms
  readonly REVERSE_SPEED = 50; // ms

  game!: Game;
  eventQueue: Event[] = [];
  tickerId: number | undefined;

  private speed: Speed | undefined;
  private speedInterval = 0;
  private _speed$ = new ReplaySubject<Speed>(1);
  speed$ = this._speed$.asObservable();

  private _gameState$ = new ReplaySubject<DayState[]>(1);
  gameState$ = this._gameState$.asObservable();

  private _reset$ = new Subject<void>();
  reset$ = this._reset$.asObservable();

  private _endOfDay$ = new Subject<void>();
  endOfDay$ = this._endOfDay$.asObservable();

  constructor(private httpClient: HttpClient) {
    if (this.loadGameFromJson()) {
      return;
    }

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
    this.eventQueue = [];
    this._reset$.next();
    this.setSpeed(speed);
    this.showEvents(this.game.rampUpEvents);
    this.updateChart();
    // this.saveCheckpoint();
  }

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
      this.scheduleTick(this.PLAY_SPEED);
    } else if (speed === 'auto') {
      this.scheduleTick();
    } else if (speed === 'fwd') {
      this.scheduleTick(this.FAST_SPEED);
    } else if (speed === 'rev') {
      this.scheduleTick(this.REVERSE_SPEED);
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
      this.setSpeed('finished');
      return;
    }

    const gameUpdate = this.game.moveForward();
    if (gameUpdate.dayState.date.endsWith('01')) this.saveCheckpoint();
    this.showEvents(gameUpdate.events);

    this._endOfDay$.next();
    if (updateChart) this.updateChart();
  }

  private showEvents(events: Event[] | undefined) {
    if (!events?.length) return;
    if (this.speed === 'max') return;

    this.eventQueue = this.eventQueue.concat(events);
    this.setSpeed('pause');
  }

  removeEvent() {
    this.eventQueue.shift();
  }

  get currentEvent() {
    return this.eventQueue[0];
  }

  getGameData(): GameData {
    return {
      mitigations: {
        history: this.game.mitigationHistory,
        params: this.game.mitigationParams,
        controlChanges: this.game.mitigationControlChanges,
      },
      simulation: this.modelStates,
      eventChoices: this.game.eventChoices,
    };
  }

  save$() {
    this.saveCheckpoint();
    const gameData = this.getGameData();
    return this.httpClient.post('/api/game-data', gameData).pipe(
      tap((data: any) => this.saveGameId(data.id)),
    );
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

  private loadGameFromJson() {
    this.setSpeed('pause');
    const dataString = window.localStorage.getItem(LocalStorageKey.LAST_GAME_DATA);
    if (!dataString) return false;

    try {
      const game = validateGame(JSON.parse(dataString));
      if (!game) return false;

      this.game = game;
      this.game.scenario.dates.endDate = scenarios.czechiaGame.dates.endDate;
      this._reset$.next();
      this.setSpeed('play');
      this.updateChart();
    } catch {
      return false;
    }

    return true;
  }

  private scheduleTick(interval?: number) {
    if (interval !== undefined) this.speedInterval = interval;
    else {
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
      }

      const speed = speedInterval[0] + (speedInterval[1] - speedInterval[0]) *
        (infectionChange - ratioInterval[0]) / (ratioInterval[1] - ratioInterval[0]);

      if (speed > this.speedInterval) this.speedInterval += 100;
      if (speed < this.speedInterval) this.speedInterval -= 100;

      this.speedInterval = Math.max(speedInterval[0], this.speedInterval);
      this.speedInterval = Math.min(speedInterval[1], this.speedInterval);
    }

    this.tickerId = window.setTimeout(() => {
      this.tick();
      if (this.tickerId) this.scheduleTick(this.speedInterval);
    }, this.speedInterval);
  }
}
