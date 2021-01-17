import {Injectable} from '@angular/core';
import {CanActivate} from '@angular/router';
import {LayoutUtilsService} from 'src/app/services/layout-utils.service';

@Injectable()
export class CanActivateGame implements CanActivate {
  constructor(private layoutUtils: LayoutUtilsService) {}

  canActivate() {
    this.layoutUtils.setIsGame(true);
    return true;
  }
}
