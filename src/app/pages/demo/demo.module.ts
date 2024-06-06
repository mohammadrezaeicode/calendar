import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemoComponent } from './demo.component';
import { RouterModule } from '@angular/router';
import { CalendarModule } from '../../shared/calendar/calendar.module';

@NgModule({
  declarations: [DemoComponent],
  imports: [
    CommonModule,
    CalendarModule,
    RouterModule.forChild([
      {
        path: '',
        component: DemoComponent,
      },
    ]),
  ],
})
export class DemoModule {}
