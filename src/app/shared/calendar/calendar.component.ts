import {
  Component,
  ElementRef,
  Input,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  MatCalendar,
  MatDatepickerInputEvent,
} from '@angular/material/datepicker';
import { TimeConvertPipe } from './utils/time-convert-pip';
import {
  CalenderItem,
  CalenderMode,
  DayReservedMap,
  DialogMode,
} from './model/calender';
import { CalendarService } from './service/calendar.service';
import { CalenderHashTable } from './model/calender-hash-table';
import { CalenderEvent } from './model/event';
import {
  CdkDragEnd,
  CdkDragStart,
  DragRef,
  Point,
} from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Observable, map, of, startWith } from 'rxjs';
import { DateUtils } from './utils/date-utils';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
})
export class CalendarComponent implements OnInit {
  @ViewChild('dialog') temp?: TemplateRef<unknown>;
  @ViewChild('boundary') boundaryElement?: ElementRef;
  @ViewChild('calendar') calendar?: MatCalendar<Date>;

  @Input() height: string = '500px';

  startWeek: number = -1;
  endWeek: number = -1;
  selectedDay: number = -1;
  mode: CalenderMode = 'NONE';
  yearAndMonth: string = '';
  selected: Date | number = new Date();
  calenderHashTable: CalenderHashTable = {} as CalenderHashTable;
  eventRecord: Record<number, CalenderItem[]> = {};
  startDate: Date = new Date();
  endDate: Date = new Date();
  breakPoint = false;
  form: FormGroup;
  selectedItemForDelete: CalenderItem | null = null;
  reservedTime: Record<string, Record<number, string>> = {};
  dialogMode: DialogMode = 'CREATE';
  dayReservedMap: DayReservedMap = {};
  searchItem: string[] = [];
  searchControl: FormControl = new FormControl('');
  filteredOptions: Observable<string[]> = of([]);
  dayOfWeekName = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  resetSignal = 1;
  constructor(
    private calendarService: CalendarService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private _snackBar: MatSnackBar,
    private breakpointObserver: BreakpointObserver
  ) {
    this.form = this.fb.group({
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      date: ['', Validators.required],
      label: ['', Validators.required],
    });
    calendarService.observeEventItems().subscribe((calender) => {
      this.calenderHashTable = calender;
      this.updateEventList(calender);
    });
    this.breakpointObserver
      .observe(['(max-width: 1000px)'])
      .subscribe((result) => {
        this.breakPoint = result.matches;
      });
  }
  ngOnInit(): void {
    this.configureCalendar();
    this.filteredOptions = this.searchControl.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value || ''))
    );
    this.searchControl.valueChanges.subscribe((value: string) => {
      if (value.length > 8 && this.searchItem.indexOf(value) >= 0) {
        let items: string[] = value.split('-');
        if (items.length > 0) {
          this.form.get('startTime')?.setValue(items[0]);
          this.form.get('endTime')?.setValue(items[1]);
        }
      }
    });
  }
  trackFilter(index: number, item: string) {
    return index + item;
  }
  dateChanged(date: MatDatepickerInputEvent<any, any>) {
    let useDate = this.dayReservedMap[DateUtils.format(date.value)];
    let searchItem = CalenderEvent.generateRangeTimeArray();
    this.searchItem = !useDate
      ? searchItem
      : searchItem.reduce(
          (result: string[], current: string, index: number) => {
            let partReserved = useDate.canReserveItemDate[index];
            let reserved = useDate.reservedItemsDate[index];
            if (partReserved) {
              result.push(partReserved);
            } else if (!reserved) {
              result.push(current);
            }
            return result;
          },
          []
        );
  }
  hasError(key: string) {
    const control = this.form.get(key);
    return control?.hasError && control.touched;
  }
  reset() {
    this.form.reset();
    this.form.markAsUntouched();
  }
  dragEnded(
    item: CalenderItem,
    event: CdkDragEnd<unknown>,
    selectedDay: number,
    node: HTMLDivElement
  ) {
    const backward = event.distance.y < 0;
    const move = (event.distance.y * 60) / 100;
    let startDate = DateUtils.createDateBaseOnTime(item.startTime);
    startDate = DateUtils.add(startDate, move, 'min');
    let newStartTime = DateUtils.formatAsTime(startDate);
    let endDate = DateUtils.createDateBaseOnTime(item.endTime);
    endDate = DateUtils.add(endDate, move, 'min');
    let newEndTime = DateUtils.formatAsTime(endDate);
    let distance = DateUtils.timeDiff(item.startTime, item.endTime) / 1000 / 60;

    const startIsBiggerEnd = newStartTime > newEndTime;
    if (startIsBiggerEnd) {
      if (backward) {
        newStartTime = '00:00';
        let dateObject = DateUtils.createDateBaseOnTime(newStartTime);
        dateObject = DateUtils.add(dateObject, distance, 'min');
        newEndTime = DateUtils.formatAsTime(dateObject);
      } else {
        newEndTime = '23:59';
        let dateObject = DateUtils.createDateBaseOnTime(newEndTime);

        dateObject = DateUtils.add(dateObject, distance * -1, 'min');
        newStartTime = DateUtils.formatAsTime(dateObject);
      }
    }
    let distanceDay = Math.round(event.distance.x / 100);
    let newDate = new Date(this.selected);
    newDate.setDate(selectedDay);
    if (distanceDay != 0) {
      newDate = DateUtils.add(newDate, distanceDay, 'day');
    }
    const startWeek = new Date(this.startDate);
    const endWeek = new Date(this.endDate);
    if (DateUtils.isDateBefore(newDate, startWeek)) {
      newDate = startWeek;
    } else if (DateUtils.isDateAfter(newDate, endWeek)) {
      newDate = endWeek;
    }
    let newItem = {
      date: DateUtils.format(newDate),
      endTime: newEndTime,
      startTime: newStartTime,
      id: item.id,
    };
    if (this.validateEventItems(newItem)) {
      this.calendarService.updateEvent(
        item,
        {
          ...newItem,
          id: Date.now() + '',
        },
        item.event!.getLabel()
      );
    } else {
      // this.calendarService.resetEvent();
      this._snackBar.open('Collision between times', 'close');
    }
    node.style.transform = '';
  }
  closeDialog() {
    this.reset();
    this.dialog.closeAll();
  }
  openDialog(
    dialogMode: DialogMode,
    item: CalenderItem | null = null,
    event: MouseEvent | null = null
  ) {
    if (event) {
      event.preventDefault();
    }
    this.dialogMode = dialogMode;
    this.selectedItemForDelete = item;
    if (this.temp) this.dialog.open(this.temp);
  }
  deleteItem() {
    if (this.selectedItemForDelete) {
      this.calendarService.deleteEvent(this.selectedItemForDelete);
    }
    this.closeDialog();
  }
  setElementBoundary(
    userPointerPosition: Point,
    dragRef: DragRef,
    dimensions: DOMRect,
    pickupPositionInElement: Point
  ): Point {
    let el = this.boundaryElement?.nativeElement.getBoundingClientRect();
    let moved = {
      x: userPointerPosition.x - pickupPositionInElement.x,
      y: userPointerPosition.y - pickupPositionInElement.y,
    };
    if (userPointerPosition.x < el.x) {
      return pickupPositionInElement;
    }
    return moved;
  }
  acceptDialog() {
    if (this.dialogMode == 'CREATE') {
      this.createItem();
    } else {
      this.deleteItem();
    }
  }
  createItem() {
    if (this.form.valid) {
      const endTime = this.form.value.endTime.toLowerCase();
      const startTime = this.form.value.startTime.toLowerCase();
      const validTime = DateUtils.validateStartAndEndDate(
        startTime,
        endTime
      );
      if (!validTime) {
        this._snackBar.open('Start time must be before end time', 'close');
        return;
      }
      const newItem = {
        date: DateUtils.format(this.form.value.date),
        endTime: DateUtils.formatTime(endTime),
        startTime: DateUtils.formatTime(startTime),
        id: Date.now() + '',
      };
      if (!this.validateEventItems(newItem)) {
        this._snackBar.open('Collision between times', 'close');
        return;
      }
      this.calendarService.createEvent(newItem, this.form.value.label);
      this.closeDialog();
    } else {
      this.form.markAllAsTouched();
    }
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

  updateEventList(calenderHashTable: CalenderHashTable) {
    const eventRecord: Record<number, CalenderItem[]> = {};
    let dates = this.getDateRanges();
    dates.forEach((date: Date) => {
      let reservedItemsDate: Record<number, boolean> = {};
      let canReserveItemDate: Record<number, string> = {};
      const day = new Date(date).getDate();
      const dateKey = DateUtils.format(date);
      const data = calenderHashTable.getItems(dateKey);
      if (!data) {
        return;
      }
      const values: CalenderItem[] = Object.values(data);
      values.forEach((item) => {
        if (item.event) {
          if (!eventRecord[day]) {
            eventRecord[day] = [];
          }
          eventRecord[day].push(item);
          if (item.event) {
            let { reservedItems, canReserveItem } =
              item.event.generateDifferentArray();
            reservedItemsDate = { ...reservedItemsDate, ...reservedItems };
            canReserveItemDate = { ...canReserveItemDate, ...canReserveItem };
          }
        }
      });
      this.dayReservedMap[dateKey] = {
        reservedItemsDate,
        canReserveItemDate,
      };
    });
    this.eventRecord = { ...eventRecord };
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.searchItem.filter((option) =>
      option.toLowerCase().includes(filterValue)
    );
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
    this.updateEventList(this.calenderHashTable);
  }
  getDayEventItem(day: number) {
    const records = this.eventRecord[day];
    return records ? records : [];
  }
  selectedRow(day: number, time: number) {
    let date = new Date(this.selected);
    date.setDate(day);
    this.form.setValue({
      startTime: TimeConvertPipe.convertor(time - 1, true),
      endTime: TimeConvertPipe.convertor(time, true),
      date: date,
      label: '',
    });
    this.openDialog('CREATE');
  }
  getItem(day: number) {
    return this.eventRecord[day];
  }
  goToday() {
    const selectedDate = new Date();
    this.selectedDateChange(selectedDate);
    if (this.calendar) {
      this.calendar.activeDate = selectedDate;
      this.calendar.selected = selectedDate;
      this.calendar.updateTodaysDate();
    }
  }
  selectedDateChange($event: Date | string) {
    this.selected = new Date($event);
    this.configureCalendar();
  }
  validateEventItems(item: CalenderItem) {
    let items = this.calenderHashTable.getItems(item.date);
    let valid = true;
    if (items) {
      let keys = Object.keys(items);
      const newStartTime = item.startTime;
      const newEndTime = item.endTime;
      const length = keys.length;
      for (let index = 0; index < length; index++) {
        const element = items[keys[index]];
        if (element.id == item.id) {
          continue;
        }
        const elStartTime = element.startTime;
        const elEndTime = element.endTime;
        if (
          (newStartTime < elEndTime && newEndTime >= elEndTime) ||
          (newEndTime > elStartTime && newEndTime <= elEndTime) ||
          (newStartTime > elStartTime && newEndTime < elEndTime)
        ) {
          valid = false;
        }
      }
    }
    console.log(valid);
    
    return valid;
  }
  setStyle(item: CalenderItem) {
    const event = item.event!;
    const top = event.getStartHour() * 100 + 100 + event.getStartPresentMin();
    const height =
      event.getEndHour() * 100 + 100 + event.getEndPresentMin() - top;

    return {
      top: top + 'px',
      height: height + 'px',
    };
  }
}
