import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { Preferences } from '../../models/preferences';

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
export class ReplayIconToggleComponent {
	showClassIcon: boolean;

	@Input() set prefs(value: Preferences) {
		if (!value) {
			return;
		}

		this.showClassIcon = value.replaysShowClassIcon;
		// if (!(this.cdr as ViewRef)?.destroyed) {
		// 	this.cdr.detectChanges();
		// }
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}
}
