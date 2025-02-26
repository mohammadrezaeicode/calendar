import { CalenderEvent } from './event';

export type CalenderMode = 'NEXT' | 'PERVIOUS' | 'NONE';
export interface CalenderItem {
  startTime: string;
  endTime: string;
  date: string;
  id:string;
  event?: CalenderEvent;
}

export type DialogMode = 'DELETE' | 'CREATE'|'EDIT';

export interface DayReservedMap {
  [date: string]: {
    reservedItemsDate: Record<number, boolean>;
    canReserveItemDate: Record<number, string>;
  };
}
