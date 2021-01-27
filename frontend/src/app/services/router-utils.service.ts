import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {NavigationEnd, Router} from '@angular/router';
import {filter} from 'rxjs/operators';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';

export function changeFavicon(virus = false) {
  const favIcon16: any = document.querySelector('#appIcon16');
  const favIcon32: any = document.querySelector('#appIcon32');
  const favIcon96: any = document.querySelector('#appIcon96');
  const appleTouchIcon: any = document.querySelector('#appleTouchIcon');
  const webmanifest: any = document.querySelector('#webmanifest');
  const maskIcon: any = document.querySelector('#maskIcon');

  favIcon16.href = virus ? 'assets/favicon/favicon-virus-16x16.png' : 'assets/favicon/favicon-controller-16x16.png';
  favIcon32.href = virus ? 'assets/favicon/favicon-virus-32x32.png' : 'assets/favicon/favicon-controller-32x32.png';
  favIcon96.href = virus ? 'assets/favicon/favicon-virus-96x96.png' : 'assets/favicon/favicon-controller-96x96.png';
  appleTouchIcon.href = virus ? '/assets/favicon/apple-icon-virus-180x180.png' : '/assets/favicon/apple-icon-controller-180x180.png';
  webmanifest.href = virus ? '/assets/favicon/site-virus.webmanifest' : '/assets/favicon/site-controller.webmanifest';
  maskIcon.href = virus ? '/assets/favicon/favicon-virus.svg' : '/assets/favicon/favicon-controller.svg';
}

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class RouterUtilsService {
  private isGame = new BehaviorSubject<boolean>(false);

  constructor(router: Router) {
    router.events.pipe(
      filter(event => event instanceof NavigationEnd && event.urlAfterRedirects !== '/game'),
      untilDestroyed(this),
    ).subscribe(() => changeFavicon());
  }

  getIsGame() {
    return this.isGame.asObservable();
  }

  setIsGame(value: boolean) {
    this.isGame.next(value);
  }
}
