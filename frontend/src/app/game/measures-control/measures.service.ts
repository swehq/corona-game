import {Injectable} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class MeasuresService {
  formGroup = new FormGroup({
    rousky: new FormControl(),
    doma: new FormControl(),
    hranice: new FormControl(),
    akce: new FormControl(),
    sluzby: new FormControl(),
    skoly: new FormControl(),
  });
}
