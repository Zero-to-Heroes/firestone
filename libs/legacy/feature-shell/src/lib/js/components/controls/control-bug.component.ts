import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SettingsControllerService } from '@firestone/settings';
import { PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService } from '@firestone/shared/framework/core';

@Component({
	selector: 'control-bug',
	styleUrls: [
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-bug.component.scss`,
	],
	template: `
		<button
			(click)="showBugForm()"
			[helpTooltip]="'app.global.controls.bug-button-tooltip' | owTranslate"
			[attr.aria-label]="'app.global.controls.bug-button-tooltip' | owTranslate"
		>
			<svg class="svg-icon-fill">
				<use
					xmlns:xlink="https://www.w3.org/1999/xlink"
					xlink:href="assets/svg/sprite.svg#window-control_bug"
				></use>
			</svg>
		</button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlBugComponent {
	constructor(
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private readonly settingsController: SettingsControllerService,
	) {}

	async showBugForm() {
		this.settingsController.selectNodeId('general-bug');
		// Avoid flickering
		setTimeout(async () => {
			const prefs = await this.prefs.getPreferences();
			const settingsWindow = await this.ow.getSettingsWindow(prefs);
			this.ow.restoreWindow(settingsWindow.id);
			this.ow.bringToFront(settingsWindow.id);
		}, 10);
	}
}
