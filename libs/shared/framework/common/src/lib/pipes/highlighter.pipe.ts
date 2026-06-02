import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'highlighter',
	standalone: false,
})
export class HighlighterPipe implements PipeTransform {
	transform(value: any, args: any): unknown {
		if (!args) return value;
		const re = new RegExp(args, 'igm');
		value = value.replace(re, '<span class="highlighted-text">$&</span>');
		return value;
	}
}
