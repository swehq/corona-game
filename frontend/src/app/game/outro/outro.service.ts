import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {shareReplay, switchMap} from 'rxjs/operators';

export interface GameResult {
  dead: number;
  cost: number;
}

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class OutroService {

  private _myResult$ = new BehaviorSubject<GameResult | undefined>(undefined);

  myResult$ = this._myResult$.asObservable();
  allResults$: Observable<GameResult[]>;

  private fetch$ = new Subject();

  constructor(
    private httpClient: HttpClient,
  ) {
    this.allResults$ = this.fetch$.pipe(
      switchMap(() => this.httpClient.get<GameResult[]>('/api/game-data')),
      shareReplay(1),
      untilDestroyed(this),
    );

    this.allResults$.subscribe();
  }

  setMyResult(result: GameResult) {
    this._myResult$.next(result);
  }

  fetchAllResults() {
    this.fetch$.next();
  }
}
