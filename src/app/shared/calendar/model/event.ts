
export class CalenderEvent {
  private label: string;
  private start: string;
  private end: string;
  private startHour: number;
  private startMin: number;
  private endMin: number;
  private startPresentMin: number;
  private endHour: number;
  private endPresentMin: number;

  constructor(start: string, end: string, label: string) {
    if (!this.validateTime(start) || !this.validateTime(end)) {
      throw new Error('start or end time is invalid');
    }
    this.start = start;
    this.end = end;
    this.label = label;
    const [startHour, startMin] = start.split(':');
    this.startMin = +startMin;
    this.startHour = +startHour;
    this.startPresentMin = this.calculatePresent(this.startMin);
    const [endHour, endMin] = end.split(':');
    this.endMin = +endMin;
    this.endHour = +endHour;
    this.endPresentMin = this.calculatePresent(this.endMin);
  }
  getLabel() {
    return this.label.length ? this.label : '(no title)';
  }
  getStartHour() {
    return this.startHour;
  }
  getEndHour() {
    return this.endHour;
  }
  getEndPresentMin() {
    return this.endPresentMin;
  }
  getStartPresentMin() {
    return this.startPresentMin;
  }
  calculatePresent(min: number) {
    return (min * 100) / 60;
  }
  private static formatTime(time: string) {
    const [hour, min] = time.split(':');
    if (!hour || !min) {
      return '';
    }
    const amPM = +hour >= 12 ? 'PM' : 'AM';
    const hour12 = +hour % 12 || 12;
    return (
      hour12.toString().padStart(2, '0') +
      ':' +
      min.toString().padStart(2, '0') +
      ' ' +
      amPM
    );
  }
  getStartTime() {
    return CalenderEvent.formatTime(this.start);
  }
  getEndTime() {
    return CalenderEvent.formatTime(this.end);
  }
  toString() {
    return `${this.label} (${this.getStartTime()}-${this.getEndTime()})`;
  }
  validateTime(timeString: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(timeString)) {
      return false;
    }
    const [hours, minutes] = timeString.split(':').map(Number);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return false;
    }
    return true;
  }
  generateDifferentArray() {
    let reservedItems: Record<number, boolean> = {};
    let canReserveItem: Record<number, string> = {};
    let diff = this.endHour - this.startHour;
    for (let index = 0; index < diff; index++) {
      const element = this.startHour + index;
      if (index == 0) {
        if (this.startMin > 0) {
          canReserveItem[element] =
            CalenderEvent.formatTime(element + ':00') +
            '-' +
            CalenderEvent.formatTime(element + ':' + this.startMin);
          continue;
        }
      } else if (index + 1 >= diff) {
        if (this.endMin > 0) {
          canReserveItem[element] =
            CalenderEvent.formatTime(element + ':' + this.endMin) +
            '-' +
            CalenderEvent.formatTime(element + 1 + ':00');
          continue;
        }
      }

      reservedItems[element] = true;
    }
    return {
      reservedItems,
      canReserveItem,
    };
  }
  static generateRangeTimeArray() {
    return Array(24)
      .fill('')
      .map((value, index) => {
        return (
          this.formatTime(index + ':00') +
          '-' +
          this.formatTime(index + 1 + ':00')
        );
      });
  }
}
