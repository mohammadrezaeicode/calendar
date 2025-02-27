import { NgModule } from '@angular/core';
import { CalendarModule } from './calendar/calendar.module';

@NgModule({
  declarations: [],
  imports: [CalendarModule],
  exports: [CalendarModule],
})
export class SharedModule {}
