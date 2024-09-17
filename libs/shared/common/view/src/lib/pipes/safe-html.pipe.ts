import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
@Pipe({
	name: 'safe',
})
export class SafeHtmlPipe implements PipeTransform {
	constructor(protected sanitizer: DomSanitizer) {}

	transform(htmlString: string): any {
		return this.sanitizer.bypassSecurityTrustHtml(htmlString);
	}
}
