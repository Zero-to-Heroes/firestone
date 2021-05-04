import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
	selector: 'help-tooltip',
	styleUrls: [`../../../css/component/tooltip/help-tooltip.component.scss`],
	template: ` <div class="help-tooltip" [innerHTML]="_text"></div> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpTooltipComponent {
	_text: SafeHtml;

	constructor(private cdr: ChangeDetectorRef, private sanitizer: DomSanitizer) {}

	@Input() set text(value: string) {
		// console.log('setting tooltip', value);
		this._text = this.sanitizer.bypassSecurityTrustHtml(`<div>${value}</div>`);
		// console.log('updated tooltip', this._text);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
