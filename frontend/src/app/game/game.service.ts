import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {meanBy} from 'lodash';
import {ReplaySubject, Subject} from 'rxjs';
import {tap} from 'rxjs/operators';
import {LocalStorageKey} from '../../environments/defaults';
import {Event} from '../services/events';
import {Game, GameData} from '../services/game';
import {ScenarioName} from '../services/scenario';
import {DayState} from '../services/simulation';
import {validateGame, Validity} from '../services/validate';

export type Speed = 'auto' | 'rev' | 'pause' | 'slow' | 'play' | 'fast' | 'max' | 'finished';

interface SavedGame {
  id: string;
  created: string;
}

@Injectable({
  providedIn: 'root',
})
export class GameService {
  readonly SLOW_SPEED = 2_000; // ms
  readonly PLAY_SPEED = 1_000; // ms
  readonly FAST_SPEED = 333; // ms
  readonly REVERSE_SPEED = 50; // ms

  game!: Game;
  eventQueue: Event[] = [];
  tickerId: number | undefined;

  private speed: Speed | undefined;
  private speedBeforePause: Speed = 'play';
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
  }

  get lastDate() {
    return this.game.simulation.lastDate;
  }

  get modelStates() {
    return this.game.simulation.modelStates;
  }

  restartSimulation(speed: Speed = 'play', scenarioName: ScenarioName = 'czechiaGame') {
    this.setSpeed('pause');
    this.removeCheckpoint();
    this.game = new Game(scenarioName);
    this.game.rampUpGame();
    this.eventQueue = [];
    this._reset$.next();
    this.setSpeed(speed);
    this.showEvents(this.game.rampUpEvents);
    this.updateChart();
  }

  private updateChart() {
    this._gameState$.next(this.game.simulation.modelStates);
  }

  togglePause() {
    if (this.speed === 'pause') this.setSpeed(this.speedBeforePause);
    else this.setSpeed('pause');
  }

  setSpeed(speed: Speed) {
    if (this.speed === speed) return;
    if (this.tickerId) {
      window.clearTimeout(this.tickerId);
      this.tickerId = undefined;
    }

    if (['slow', 'play', 'fast', 'auto'].includes(speed)) {
      this.speedBeforePause = speed;
    }

    this.speed = speed;
    this._speed$.next(speed);

    if (speed === 'max') {
      while (!this.game.isFinished()) this.tick(false);
      this.updateChart();
      this.setSpeed('pause');
    } else if (speed === 'slow') {
      this.scheduleTick(this.SLOW_SPEED);
    } else if (speed === 'play') {
      this.scheduleTick(this.PLAY_SPEED);
    } else if (speed === 'auto') {
      this.scheduleTick();
    } else if (speed === 'fast') {
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
      scenarioName: this.game.scenarioName,
      randomSeed: this.game.randomSeed,
      simulation: this.modelStates,
      eventChoices: this.game.eventChoices,
    };
  }

  save$() {
    this.saveCheckpoint();
    const gameData = this.getGameData();
    return this.httpClient.post<SavedGame>('/api/game-data', gameData).pipe(
      tap(data => {
        this.saveGameId(data.id, data.created);
        this.removeCheckpoint();
      }),
    );
  }

  private saveGameId(id: string, created: string) {
    const storageValue = window.localStorage.getItem(LocalStorageKey.SAVED_GAMES);
    let games: SavedGame[] = [];

    if (storageValue) games = JSON.parse(storageValue);

    games.push({id, created});
    window.localStorage.setItem(LocalStorageKey.SAVED_GAMES, JSON.stringify(games));
  }

  private saveCheckpoint() {
    window.localStorage.setItem(LocalStorageKey.LAST_GAME_DATA, JSON.stringify(this.getGameData()));
  }

  private removeCheckpoint() {
    window.localStorage.removeItem(LocalStorageKey.LAST_GAME_DATA);
  }

  isMyGameId(id: string) {
    const games = window.localStorage.getItem(LocalStorageKey.SAVED_GAMES);
    if (!games) return false;
    if ((JSON.parse(games) as any[]).find(g => g.id === id)) return true;
    return false;
  }

  loadGameFromJson() {
    const dataString = window.localStorage.getItem(LocalStorageKey.LAST_GAME_DATA);
    if (!dataString) return false;

    try {
      const {validity, game} = validateGame(JSON.parse(dataString));
      const allowedValidity: Validity[] = ['valid', 'too-short'];
      if (!allowedValidity.includes(validity) || !game) return false;
      this.restoreGame(game);
    } catch {
      return false;
    }

    return true;
  }

  isLocalStorageGame() {
    return Boolean(window.localStorage.getItem(LocalStorageKey.LAST_GAME_DATA));
  }

  restoreGame(game: Game) {
    this.setSpeed('pause');
    this.game = game;
    this._reset$.next();
    this.updateChart();
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

  pause() {
    if (this.speed === 'pause') return;
    if (this.speed === 'finished') return;
    this.setSpeed('pause');
  }
}
