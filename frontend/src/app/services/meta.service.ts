import {Injectable} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {TranslateService} from '@ngx-translate/core';
import {environment} from '../../environments/environment';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class MetaService {

  private page?: string;

  constructor(
    private title: Title,
    private translateService: TranslateService,
  ) {
    this.translateService.onLangChange.pipe(
      untilDestroyed(this),
    ).subscribe(
      () => this.updateTitle(),
    );
  }

  setTitle(page: string) {
    this.page = page;
    this.updateTitle();
  }

  private updateTitle() {
    const base = this.translateService.instant(environment.baseTitle);
    const full = this.page
      ? [this.translateService.instant(this.page), base].join(' · ')
      : base;

    this.title.setTitle(full);
  }
}
