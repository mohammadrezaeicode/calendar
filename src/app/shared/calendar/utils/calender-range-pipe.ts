import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'calendarRange',
})
export class CalendarRangePipe implements PipeTransform {
  transform(
    value: number,
    end: number,
    step: number = 7,
    addZero = false
  ): number[] {
    if (!value && value !== 0) {
      return [];
    }
    if (value > end) {
      let resultRight: number[] = [];
      for (let index = 1; index <= end; index++) {
        resultRight.push(index);
      }
      let resultLeft: number[] = [];
      if (addZero) {
        resultLeft.push(0);
      }
      const remind = step - resultRight.length;
      for (let index = 0; index < remind; index++) {
        resultLeft.push(value + index);
      }
      return [...resultLeft, ...resultRight];
    } else {
      let resultArray: number[] = Array<number>(step)
        .fill(0)
        .map((x, i) => value + i);
      if (addZero) {
        resultArray.unshift(0);
      }
      return resultArray;
    }
  }
}
