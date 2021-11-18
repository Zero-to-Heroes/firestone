import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'replays-icon-toggle',
	styleUrls: [`../../../css/component/replays/replays-icon-toggle.component.scss`],
	template: `
		<preference-toggle
			class="replays-icon-toggle"
			field="replaysShowClassIcon"
			label="Use class icons"
			helpTooltip="Toggle between class icons and hero icons"
		></preference-toggle>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplayIconToggleComponent {}
