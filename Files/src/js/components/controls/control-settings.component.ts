import { Component, ViewEncapsulation, ChangeDetectionStrategy, Input, AfterViewInit, EventEmitter } from '@angular/core';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'control-settings',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-settings.component.scss`,
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<button class="i-30 pink-button" (mousedown)="showSettings()">
			<svg class="svg-icon-fill">
				<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_settings"></use>
			</svg>
		</button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlSettingsComponent implements AfterViewInit {
	@Input() settingsApp: string;
	@Input() windowId: string;
	@Input() shouldMoveSettingsWindow = true;
	@Input() settingsSection: string;

	private settingsWindowId: string;
	private settingsEventBus: EventEmitter<string>;

	constructor(private ow: OverwolfService) {}

	async ngAfterViewInit() {
		this.settingsEventBus = this.ow.getMainWindow().settingsEventBus;
		try {
			const window = await this.ow.obtainDeclaredWindow('SettingsWindow');
			this.settingsWindowId = window.id;
		} catch (e) {
			this.ngAfterViewInit();
		}
	}

	async showSettings() {
		if (this.settingsApp) {
			this.settingsEventBus.next(this.settingsApp);
		}
		const window = await this.ow.getCurrentWindow();
		const center = {
			x: window.left + window.width / 2,
			y: window.top + window.height / 2,
		};
		if (this.shouldMoveSettingsWindow) {
			await this.ow.sendMessage(this.settingsWindowId, 'move', center);
		}
		this.ow.restoreWindow(this.settingsWindowId);
	}
}
