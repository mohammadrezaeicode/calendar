export type AddType = 'day' | 'month' | 'min';
export class DateUtils {
  static createDateBaseOnTime(time: string) {
    return new Date(`2024-01-01 ${time}`);
  }
  static timeDiff(startTime: string, endTime: string) {
    const startDate = this.createDateBaseOnTime(startTime).getTime();

    const endDate = this.createDateBaseOnTime(endTime).getTime();
    return endDate - startDate;
  }
  static dayMill: number = 86400000;
  static startWeek(date: number | Date) {
    let dateObject = new Date(date);
    let weekDay = dateObject.getDay();
    if (weekDay === 0) {
      return dateObject;
    } else {
      return new Date(dateObject.getTime() - weekDay * this.dayMill);
    }
  }
  static endWeek(date: number | Date) {
    let dateObject = new Date(date);
    let weekDay = dateObject.getDay();
    if (weekDay === 6) {
      return dateObject;
    } else {
      return new Date(dateObject.getTime() + (6 - weekDay) * this.dayMill);
    }
  }
  static add(date: number | Date, count: number, type: AddType) {
    let dateObj = new Date(date);
    if (type == 'day') {
      return new Date(dateObj.getTime() + this.dayMill * count);
    } else if (type == 'month') {
      dateObj.setMonth(dateObj.getMonth() + count);
      return dateObj;
    } else if (type == 'min') {
      dateObj.setMinutes(dateObj.getMinutes() + count);
      return dateObj;
    } else {
      return new Date(date);
    }
  }
  static format(date: number | Date) {
    let dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  static formatAsTime(date: number | Date) {
    let dateObj = new Date(date);
    const hour = String(dateObj.getHours()).padStart(2, '0');
    const min = String(dateObj.getMinutes()).padStart(2, '0');
    return `${hour}:${min}`;
  }
  static formatYearMonth(date: number | Date) {
    let dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
  static formatTime(time: string) {
    const date = this.createDateBaseOnTime(time);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let timeString = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;

    return timeString;
  }
  static validateStartAndEndDate(startTime: string, endTime: string) {
    return this.timeDiff(startTime, endTime) > 0;
  }
  static isDateBefore(startDate: Date, endDate: Date) {
    return this.format(startDate) < this.format(endDate);
  }
  static isDateAfter(startDate: Date, endDate: Date) {
    return this.format(startDate) > this.format(endDate);
  }
  static isDateFullComparisonBefore(startDate: Date, endDate: Date) {
    return startDate.getTime() < endDate.getTime();
  }
  static isDateFullComparisonAfter(startDate: Date, endDate: Date) {
    return startDate.getTime() > endDate.getTime();
  }
}
