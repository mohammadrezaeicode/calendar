import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CalenderItem } from '../model/calender';
import { CalenderHashTable } from '../model/calender-hash-table';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  items: CalenderHashTable = new CalenderHashTable({});
  calenderEventItemSubject: BehaviorSubject<CalenderHashTable> =
    new BehaviorSubject<CalenderHashTable>(new CalenderHashTable({}));
  constructor() {
    this.createEvent(
      {
        date: '2025-02-26',
        endTime: '01:00',
        startTime: '00:30',
        id: 'def0',
      },
      'test'
    );
    this.createEvent(
      {
        date: '2025-02-26',
        endTime: '02:00',
        startTime: '01:30',
        id: 'def1',
      },
      'test2'
    );
  }
  observeEventItems(): Observable<CalenderHashTable> {
    return this.calenderEventItemSubject.asObservable();
  }
  updateEvent(
    item: CalenderItem,
    newItem: CalenderItem,
    label: string,
    apply: boolean = true
  ) {
    this.items.deleteItem(item.date, item.startTime);
    this.items.addItem(newItem, label);
    if (apply) {
      this.calenderEventItemSubject.next(this.items);
    }
  }
  resetEvent() {
    this.calenderEventItemSubject.next(this.items);
  }
  createEvent(item: CalenderItem, label: string) {
    this.items.addItem(item, label);
    this.calenderEventItemSubject.next(this.items);
  }
  deleteEvent(item: CalenderItem) {
    this.items.deleteItem(item.date, item.startTime);
    this.calenderEventItemSubject.next(this.items);
  }
}
