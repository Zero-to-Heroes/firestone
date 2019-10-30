import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';

@Component({
	selector: 'help-tooltip',
	styleUrls: [`../../../css/component/tooltip/help-tooltip.component.scss`],
	template: `
		<div class="help-tooltip">{{ _text }}</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpTooltipComponent {
	_text: string;

	constructor(private cdr: ChangeDetectorRef) {}

	@Input() set text(value: string) {
		this._text = value;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
