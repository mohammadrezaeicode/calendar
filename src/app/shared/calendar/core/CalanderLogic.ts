import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { CalenderItem, CalenderMode } from '../model/calender';
import { CalenderHashTable } from '../model/calender-hash-table';
import { DateUtils } from '../utils/date-utils';
import { TimeConvertPipe } from '../utils/time-convert-pip';
import { BehaviorSubject } from 'rxjs';
@Injectable()
export class CalendarLogic {
  public startWeek: number = -1;
  public endWeek: number = -1;
  public selectedDay: number = -1;
  mode: CalenderMode = 'NONE';
  yearAndMonth: string = '';
  public selected: Date | number = new Date();
  calenderHashTable: CalenderHashTable = {} as CalenderHashTable;
  eventRecord: Record<number, CalenderItem[]> = {};
  startDate: Date = new Date();
  endDate: Date = new Date();
  public dayOfWeekName = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  configurationChangedSubject = new BehaviorSubject<CalenderHashTable>(
    new CalenderHashTable({})
  );
  constructor() {}
  getConfigurationChangedSubject() {
    return this.configurationChangedSubject.asObservable();
  }
  configureCalendar() {
    this.mode = 'NONE';
    if (!this.selected) {
      this.selected = new Date();
    }
    this.yearAndMonth = DateUtils.formatYearMonth(this.selected);
    let startWeekDateObject = DateUtils.startWeek(this.selected);
    this.startWeek = startWeekDateObject.getDate();
    this.selectedDay = new Date(this.selected).getDate();
    let endWeekDateObject = DateUtils.endWeek(this.selected);
    this.endWeek = endWeekDateObject.getDate();
    if (this.startWeek > this.endWeek) {
      if (this.selectedDay >= this.startWeek) {
        this.mode = 'NEXT';
      } else {
        this.mode = 'PERVIOUS';
      }
    }
    this.startDate = new Date(startWeekDateObject);
    this.endDate = new Date(endWeekDateObject);
    this.configurationChangedSubject.next(this.calenderHashTable);
  }
  public getDayEventItem(day: number) {
    const records = this.eventRecord[day];
    return records ? records : [];
  }

  selectedRow(day: number, time: number) {
    let date = new Date(this.selected);
    date.setDate(day);
    return {
      startTime: TimeConvertPipe.convertor(time - 1, true),
      endTime: TimeConvertPipe.convertor(time, true),
      date: date,
      label: '',
    };
  }

  getDateRanges() {
    const dates = [];
    let startDate = new Date(this.startDate);
    for (let index = 0; index < 7; index++) {
      dates.push(startDate);
      startDate = DateUtils.add(startDate, 1, 'day');
    }
    return dates;
  }
  getItem(day: number) {
    return this.eventRecord[day];
  }
  goToday() {
    const selectedDate = new Date();
    this.selectedDateChange(selectedDate);
    return selectedDate;
  }
  selectedDateChange($event: Date | string) {
    this.selected = new Date($event);
    this.configureCalendar();
  }
}
