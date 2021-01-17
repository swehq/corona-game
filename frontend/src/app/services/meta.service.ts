import {Injectable} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MetaService {
  constructor(
    private title: Title,
  ) {}

  setTitle(title: string) {
    const fullTitle = title ? title + ' · ' + environment.baseTitle : environment.baseTitle;

    this.title.setTitle(fullTitle);
  }
}
