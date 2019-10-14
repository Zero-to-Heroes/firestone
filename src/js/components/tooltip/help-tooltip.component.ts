import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
	selector: 'help-tooltip',
	styleUrls: [`../../../css/component/tooltip/help-tooltip.component.scss`],
	template: `
		<div class="help-tooltip">{{ text }}</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpTooltipComponent {
	@Input() text: string;
}
