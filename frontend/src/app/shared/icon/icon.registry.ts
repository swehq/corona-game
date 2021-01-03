import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {ICONS} from './icons';

export type SvgIconName = keyof typeof ICONS;

export function initIconRegistry(
  iconRegistry: MatIconRegistry,
  domSanitizer: DomSanitizer,
) {
  Object.entries(ICONS).forEach(([name, svg]) => {
    if (svg) {
      const html = domSanitizer.bypassSecurityTrustHtml(svg!);
      iconRegistry.addSvgIconLiteral(name, html);
    } else {
      const url = domSanitizer.bypassSecurityTrustResourceUrl(`/assets/icons/${name}.svg`);
      iconRegistry.addSvgIcon(name, url);
    }
  });
}
