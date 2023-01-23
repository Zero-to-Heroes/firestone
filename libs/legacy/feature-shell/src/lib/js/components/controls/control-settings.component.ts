import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { PreferencesService } from '../../services/preferences.service';

@Component({
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
export class ControlSettingsComponent implements AfterViewInit {
	@Input() settingsApp: string;
	@Input() shouldMoveSettingsWindow = true;
	@Input() settingsSection: string;

	private settingsEventBus: EventEmitter<[string, string]>;

	constructor(private ow: OverwolfService, private prefs: PreferencesService) {}

	async ngAfterViewInit() {
		this.settingsEventBus = this.ow.getMainWindow().settingsEventBus;
	}

	async showSettings() {
		if (this.settingsApp) {
			this.settingsEventBus.next([this.settingsApp, this.settingsSection]);
		}
		const prefs = await this.prefs.getPreferences();
		const windowName = await this.ow.getSettingsWindowName(prefs);
		const settingsWindow = await this.ow.obtainDeclaredWindow(windowName);
		// Window hidden, we show it
		if (settingsWindow.stateEx !== 'normal') {
			// Avoid flickering
			setTimeout(async () => {
				await this.ow.restoreWindow(settingsWindow.id);
				this.ow.bringToFront(settingsWindow.id);
			}, 10);
		}
		// Otherwise we hide it
		else {
			this.ow.hideWindow(settingsWindow.id);
		}
	}
}
