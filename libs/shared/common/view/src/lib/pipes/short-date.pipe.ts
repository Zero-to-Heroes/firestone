import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'shortDate',
})
export class ShortDatePipe implements PipeTransform {
	constructor(private datePipe: DatePipe) {}

	transform(value: any, ...args: any[]): any {
		const date = new Date(value);
		const format = date.getHours() > 0 ? 'hh:mm:ss' : 'mm:ss';
		return this.datePipe.transform(date, format);
	}
}
