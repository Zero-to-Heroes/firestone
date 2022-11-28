import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'replays-merc-details-toggle',
	styleUrls: [`../../../css/component/replays/replays-icon-toggle.component.scss`],
	template: `
		<preference-toggle
			class="replays-icon-toggle"
			field="replaysShowMercDetails"
			[label]="'app.replays.merc-details-toggle.label' | owTranslate"
			[helpTooltip]="'app.replays.merc-details-toggle.tooltip' | owTranslate"
		></preference-toggle>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplayMercDetailsToggleComponent {}
