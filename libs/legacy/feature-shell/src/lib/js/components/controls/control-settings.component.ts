import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, WindowHandlerFacadeService } from '@firestone/shared/framework/core';

@Component({
	standalone: false,
	selector: 'control-settings',
	styleUrls: [
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-settings.component.scss`,
	],
	template: `
		<button (click)="showSettings()" [attr.aria-label]="'Settings'">
			<svg class="svg-icon-fill">
				<use
					xmlns:xlink="https://www.w3.org/1999/xlink"
					xlink:href="assets/svg/sprite.svg#window-control_settings"
				></use>
			</svg>
		</button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlSettingsComponent {
	@Input() settingsApp: string;
	@Input() shouldMoveSettingsWindow = true;
	@Input() settingsSection: string;

	constructor(
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private readonly windowHandlerFacade: WindowHandlerFacadeService,
	) {}

	async showSettings() {
		const prefs = await this.prefs.getPreferences();
		this.windowHandlerFacade.showSettingsWindow(prefs.collectionUseOverlay);
	}
}
