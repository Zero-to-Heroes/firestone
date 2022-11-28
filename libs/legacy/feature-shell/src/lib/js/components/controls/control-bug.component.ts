import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';

@Component({
	selector: 'control-bug',
	styleUrls: [
		`../../../css/global/components-global.scss`,
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
export class ControlBugComponent implements AfterViewInit {
	private settingsEventBus: EventEmitter<[string, string]>;

	constructor(private ow: OverwolfService, private prefs: PreferencesService) {}

	async ngAfterViewInit() {
		this.settingsEventBus = this.ow.getMainWindow().settingsEventBus;
	}

	async showBugForm() {
		this.settingsEventBus.next(['general', 'bugreport']);
		// Avoid flickering
		setTimeout(async () => {
			const prefs = await this.prefs.getPreferences();
			const settingsWindow = await this.ow.getSettingsWindow(prefs);
			this.ow.restoreWindow(settingsWindow.id);
			this.ow.bringToFront(settingsWindow.id);
		}, 10);
	}
}
