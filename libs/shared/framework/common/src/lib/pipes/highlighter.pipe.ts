import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'highlighter',
})
export class HighlighterPipe implements PipeTransform {
	transform(value: any, args: any): unknown {
		console.debug('highlighter', value, args);
		if (!args) return value;
		const re = new RegExp(args, 'igm');
		value = value.replace(re, '<span class="highlighted-text">$&</span>');
		console.debug('highlighter return', value, args);
		return value;
	}
}
