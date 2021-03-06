import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'limit',
})
export class LimitPipe implements PipeTransform {

  transform(value: number, min: number, max: number): number {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

}
