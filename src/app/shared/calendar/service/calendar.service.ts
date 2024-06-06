import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CalenderItem } from '../model/calender';
import { CalenderHashTable } from '../model/calender-hash-table';
import { CalenderEvent } from '../model/event';

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
        date: '2024-05-25',
        endTime: '22:00',
        startTime: '20:30',
      },
      'test'
    );
    this.createEvent(
      {
        date: '2024-05-27',
        endTime: '14:10',
        startTime: '12:00',
      },
      'test2'
    );
  }
  observeEventItems(): Observable<CalenderHashTable> {
    return this.calenderEventItemSubject.asObservable();
  }
  updateEvent(item: CalenderItem, newItem: CalenderItem, label: string) {
    this.items.deleteItem(item.date, item.startTime);
    this.items.addItem(newItem, label);

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
