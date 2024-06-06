import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeConvert',
  pure: true,
})
export class TimeConvertPipe implements PipeTransform {
  transform(value: number): string {
    if (!value || value <= 0 || value >= 24) {
      return '';
    }
    if (value > 12) {
      return value - 12 + ' pm';
    } else if (value < 12) {
      return value + ' am';
    } else {
      return '12 pm';
    }
  }
  static convertor(value: number, withMin = false): string {
    if (withMin) {
      return new TimeConvertPipe()
        .transform(value)
        .replace(/(\d+)\s?(am|pm)/i, '$1:00 $2');
    } else {
      return new TimeConvertPipe().transform(value);
    }
  }
}
