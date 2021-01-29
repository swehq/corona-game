import {Component} from '@angular/core';
import {FormControl} from '@angular/forms';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {TranslateService} from '@ngx-translate/core';
import {LocalStorageKey} from '../../../environments/defaults';

export interface Option {
  value: string;
  label: string;
}

@UntilDestroy()
@Component({
  selector: 'cvd-language-picker',
  templateUrl: './language-picker.component.html',
  styleUrls: ['./language-picker.component.scss'],
})
export class LanguagePickerComponent {

  formControl = new FormControl();

  langOptions: Option[] = [];

  constructor(private translate: TranslateService) {
    this.langOptions = this.translate.getLangs().map(lang => ({
      value: lang,
      label: lang.toUpperCase(),
    }));

    this.formControl.setValue(translate.currentLang);
    this.formControl.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe(
      lang => {
        localStorage.setItem(LocalStorageKey.LANGUAGE, lang);
        this.translate.use(lang);
      },
    );
  }
}
