import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {BehaviorSubject, Observable, of, ReplaySubject} from 'rxjs';
import {filter, map, shareReplay, switchMap, tap} from 'rxjs/operators';
import {GameData} from '../../../services/game';
import {ScenarioName} from '../../../services/scenario';
import {validateGame} from '../../../services/validate';
import {GameService} from '../../game.service';

export interface GameResult {
  dead: number;
  cost: number;
}

interface Current {
  id?: string;
  result?: GameResult;
  gameIsReady: boolean;
}

interface GameDataResponse extends GameData {
  _id: string;
  created: string;
  results: GameResult;
}

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class OutroService {

  private _current$ = new BehaviorSubject<Current>({gameIsReady: true});
  current$ = this._current$.asObservable();

  allResults$: Observable<GameResult[]>;

  private _scenarioName$ = new ReplaySubject<ScenarioName>(1);
  scenarioName$ = this._scenarioName$.asObservable();

  constructor(
    private httpClient: HttpClient,
    private gameService: GameService,
  ) {
    // send current game result into outro
    gameService.gameState$.pipe(
      filter(states => states.length > 0),
      map(states => states[states.length - 1]),
      map(state => ({
        dead: state.stats.deaths.total,
        cost: state.stats.costs.total,
      })),
      untilDestroyed(this),
    ).subscribe(
      result => this._current$.next({result, gameIsReady: true}),
    );

    this.allResults$ = this._scenarioName$.pipe(
      switchMap(scenarioName => this.httpClient.get<GameResult[]>('/api/game-data/scenario/' + scenarioName)),
      shareReplay(1),
      untilDestroyed(this),
    );

    this.allResults$.subscribe();
  }

  fetchAllResults(scenarioName: ScenarioName) {
    this._scenarioName$.next(scenarioName);
  }

  loadGame$(id: string) {
    if (id === this._current$.value.id && this._current$.value.gameIsReady) return of(true);

    this._current$.next({id, gameIsReady: false});

    return this.httpClient.get<GameDataResponse>(`/api/game-data/${id}`).pipe(map(
      response => {
        if (!response) return false;

        const {_id, created, results, ...gameData} = response;
        this._current$.next({id, gameIsReady: false, result: results});

        const {validity, game} = validateGame(gameData);
        if (validity !== 'valid' || !game) return false;

        this.gameService.restoreGame(game);
        this._current$.next({id, gameIsReady: true, result: results});

        this.fetchAllResults(game.scenarioName);

        return true;
      },
    ));
  }

  saveGame$() {
    const {id} = this._current$.value;
    if (id) return of(id);

    return this.gameService.save$().pipe(
      map(response => response.id),
      tap(newId => {
        const current = this._current$.value;
        this._current$.next({...current, id: newId});
      }),
    );
  }
}
