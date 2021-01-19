import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {BehaviorSubject, Observable, of, Subject} from 'rxjs';
import {filter, map, shareReplay, switchMap, tap} from 'rxjs/operators';
import {GameData} from '../../../services/game';
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

  private fetch$ = new Subject();

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

    this.allResults$ = this.fetch$.pipe(
      switchMap(() => this.httpClient.get<GameResult[]>('/api/game-data')),
      shareReplay(1),
      untilDestroyed(this),
    );

    this.allResults$.subscribe();
  }

  fetchAllResults() {
    this.fetch$.next();
  }

  loadGame(id: string) {
    if (id === this._current$.value.id) return;

    this._current$.next({id, gameIsReady: false});

    this.httpClient.get<GameDataResponse>(`/api/game-data/${id}`).subscribe(
      response => {
        if (!response) return;

        const {_id, created, results, ...gameData} = response;
        this._current$.next({id, gameIsReady: false, result: results});

        const game = validateGame(gameData);
        if (!game) return;

        this.gameService.restoreGame(game);
        this._current$.next({id, gameIsReady: true, result: results});
      },
    );
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
