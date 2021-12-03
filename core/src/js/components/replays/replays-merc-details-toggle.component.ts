import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'replays-merc-details-toggle',
	styleUrls: [`../../../css/component/replays/replays-icon-toggle.component.scss`],
	template: `
		<preference-toggle
			class="replays-icon-toggle"
			field="replaysShowMercDetails"
			label="Show details"
			helpTooltip="Show more information on the mercenaries replays"
		></preference-toggle>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplayMercDetailsToggleComponent {}
