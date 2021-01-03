import {Component, HostBinding, Input, SecurityContext} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {SvgIconName} from './icon.registry';

export type IconSize = 'tiny' | 'small' | 'default' | 'large';

@Component({
  selector: 'cvd-icon',
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.scss'],
})
export class IconComponent {
  @Input() svgIcon: SvgIconName | undefined;

  @Input()
  set color(newColor: string | null) { this._color = this.domSanitizer.sanitize(SecurityContext.STYLE, newColor); }
  get color() { return this._color; }
  @HostBinding('style.color')
  private _color: string | null = null;

  @Input() size: IconSize = 'default';
  @HostBinding('class.small') get isSmall() { return this.size === 'small'; }
  @HostBinding('class.large') get isLarge() { return this.size === 'large'; }

  constructor(
    private domSanitizer: DomSanitizer,
  ) {
  }
}
