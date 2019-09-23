import { Component, ChangeDetectionStrategy, EventEmitter } from '@angular/core';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'control-bug',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-bug.component.scss`,
	],
	template: `
		<button class="i-30 pink-button" (mousedown)="showBugForm()" helpTooltip="Report a bug">
			<svg class="svg-icon-fill">
				<use
					xmlns:xlink="http://www.w3.org/1999/xlink"
					xlink:href="/Files/assets/svg/sprite.svg#window-control_bug"
				></use>
			</svg>
		</button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
// TODO: merge this with the settings control button?
export class ControlBugComponent {
	private settingsWindowId: string;
	private settingsEventBus: EventEmitter<[string, string]>;

	constructor(private ow: OverwolfService) {}

	async ngAfterViewInit() {
		this.settingsEventBus = this.ow.getMainWindow().settingsEventBus;
		try {
			const window = await this.ow.obtainDeclaredWindow(OverwolfService.SETTINGS_WINDOW);
			this.settingsWindowId = window.id;
		} catch (e) {
			this.ngAfterViewInit();
		}
	}

	async showBugForm() {
		this.settingsEventBus.next(['general', 'bugreport']);
		const window = await this.ow.getCurrentWindow();
		const center = {
			x: window.left + window.width / 2,
			y: window.top + window.height / 2,
		};
		await this.ow.sendMessage(this.settingsWindowId, 'move', center);
		this.ow.restoreWindow(this.settingsWindowId);
	}
}
