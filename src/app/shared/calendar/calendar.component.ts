import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  MatCalendar,
  MatDatepickerInputEvent,
} from '@angular/material/datepicker';
import { TimeConvertPipe } from './utils/time-convert-pip';
import { CalenderItem, DayReservedMap, DialogMode } from './model/calender';
import { CalendarService } from './service/calendar.service';
import { CalenderHashTable } from './model/calender-hash-table';
import { CalenderEvent } from './model/event';
import { CdkDragEnd, CdkDragStart } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Observable, Subscription, map, of, startWith } from 'rxjs';
import { DateUtils } from './utils/date-utils';
import { CalendarLogic } from './core/CalanderLogic';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
})
export class CalendarComponent
  extends CalendarLogic
  implements OnInit, OnDestroy
{
  @ViewChild('dialog') temp?: TemplateRef<unknown>;
  @ViewChild('boundary') boundaryElement?: ElementRef;
  @ViewChild('calendar') calendar?: MatCalendar<Date>;
  @Input() height: string = '500px';
  eventItemSubscription: Subscription;
  updateConfigurationSubscription: Subscription;
  breakPoint = false;
  form: FormGroup;
  selectedItem: CalenderItem | null = null;
  reservedTime: Record<string, Record<number, string>> = {};
  dialogMode: DialogMode = 'CREATE';
  dayReservedMap: DayReservedMap = {};
  searchItem: string[] = [];
  searchControl: FormControl = new FormControl('');
  filteredOptions: Observable<string[]> = of([]);
  hasMovingItem: boolean = false;
  constructor(
    private calendarService: CalendarService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private _snackBar: MatSnackBar,
    private breakpointObserver: BreakpointObserver
  ) {
    super();
    this.form = this.fb.group({
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      date: ['', Validators.required],
      label: ['', Validators.required],
    });
    this.eventItemSubscription = calendarService
      .observeEventItems()
      .subscribe((calender) => {
        this.calenderHashTable = calender;
        this.updateEventList(calender);
      });
    this.breakpointObserver
      .observe(['(max-width: 1000px)'])
      .subscribe((result) => {
        this.breakPoint = result.matches;
      });

    this.updateConfigurationSubscription =
      this.getConfigurationChangedSubject().subscribe((value) => {
        this.updateEventList(value);
      });
  }
  ngOnDestroy(): void {
    if (this.eventItemSubscription) {
      this.eventItemSubscription.unsubscribe();
    }
    if (this.updateConfigurationSubscription) {
      this.updateConfigurationSubscription.unsubscribe();
    }
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
  dragStarted(event: CdkDragStart<unknown>) {
    this.hasMovingItem = true;
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
      this._snackBar.open('Collision between times', 'close');
    }
    node.style.transform = '';
    this.hasMovingItem = false;
  }
  clickItem(item: CalenderItem) {
    if (this.hasMovingItem) {
      return;
    }
    this.form.setValue({
      startTime: item.startTime,
      endTime: item.endTime,
      date: new Date(item.date + ' ' + item.startTime),
      label: item.event?.getLabel() ?? '',
    });
    this.openDialog('EDIT', item, null);
  }
  validateFormAndReturnItem(id: string | null = null): CalenderItem | null {
    if (!id) {
      id = Date.now() + '';
    }
    const endTime = this.form.value.endTime.toLowerCase();
    const startTime = this.form.value.startTime.toLowerCase();
    const validTime = DateUtils.validateStartAndEndDate(startTime, endTime);
    if (!validTime) {
      this._snackBar.open('Start time must be before end time', 'close');
      return null;
    }
    const newItem: CalenderItem = {
      date: DateUtils.format(this.form.value.date),
      endTime: DateUtils.formatTime(endTime),
      startTime: DateUtils.formatTime(startTime),
      id,
    };
    if (!this.validateEventItems(newItem)) {
      this._snackBar.open('Collision between times', 'close');
      return null;
    }
    return newItem;
  }
  createItem() {
    if (this.form.valid) {
      let newItem = this.validateFormAndReturnItem();
      if (newItem) {
        this.calendarService.createEvent(newItem, this.form.value.label);
        this.closeDialog();
      }
    } else {
      this.form.markAllAsTouched();
    }
  }
  updateItem() {
    if (this.selectedItem) {
      let newItem = this.validateFormAndReturnItem(this.selectedItem.id);
      if (newItem)
        this.calendarService.updateEvent(
          this.selectedItem,
          newItem,
          this.form.get('label')?.value,
          true
        );
      this.closeDialog();
    }
  }
  deleteItem() {
    if (this.selectedItem) {
      this.calendarService.deleteEvent(this.selectedItem);
    }
    this.closeDialog();
  }
  openDialog(
    dialogMode: DialogMode,
    item: CalenderItem | null = null,
    event: MouseEvent | null = null
  ) {
    if (this.hasMovingItem) {
      return;
    }
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.dialogMode = dialogMode;
    this.selectedItem = item;
    if (this.temp) this.dialog.open(this.temp);
  }
  closeDialog() {
    this.reset();
    this.dialog.closeAll();
  }
  acceptDialog() {
    if (this.dialogMode == 'CREATE') {
      this.createItem();
    } else if (this.dialogMode == 'EDIT') {
      this.updateItem();
    } else {
      this.deleteItem();
    }
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.searchItem.filter((option) =>
      option.toLowerCase().includes(filterValue)
    );
  }
  override selectedRow(day: number, time: number) {
    let date = super.selectedRow(day, time);
    this.form.setValue(date);
    this.openDialog('CREATE');
    return date;
  }
  override goToday(): Date {
    let selectedDate = super.goToday();
    if (this.calendar) {
      this.calendar.activeDate = selectedDate;
      this.calendar.selected = selectedDate;
      this.calendar.updateTodaysDate();
    }
    return selectedDate;
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
