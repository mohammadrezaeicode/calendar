import { CalenderItem } from './calender';
import { CalenderEvent } from './event';

interface HashInterface {
  [date: string]: {
    [startTime: string]: CalenderItem;
  };
}
export class CalenderHashTable {
  private hashTableRecord: HashInterface;
  constructor(hashTableRecord: HashInterface) {
    this.hashTableRecord = hashTableRecord;
  }
  getItems(date: string) {
    return this.hashTableRecord[date];
  }
  addItem(item: CalenderItem, label: string) {
    let event = new CalenderEvent(item.startTime, item.endTime, label);
    item.event = event;
    if (!this.hashTableRecord[item.date]) {
      this.hashTableRecord[item.date] = {};
    }
    this.hashTableRecord[item.date][item.startTime] = item;
  }
  deleteItem(date: string, startTime: string) {
    if (this.hashTableRecord[date][startTime]) {
      delete this.hashTableRecord[date][startTime];
    }
  }
}
