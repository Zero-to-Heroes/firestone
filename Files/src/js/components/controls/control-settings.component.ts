import { Component, ViewEncapsulation, ChangeDetectionStrategy, Input, AfterViewInit, EventEmitter } from '@angular/core';

declare var overwolf: any;

@Component({
	selector: 'control-settings',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-settings.component.scss`,
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<button class="i-30 pink-button" (click)="showSettings()">
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
    @Input() shouldMoveSettingsWindow: boolean = true;
	@Input() settingsSection: string;

	private settingsWindowId: string;
	private settingsEventBus: EventEmitter<string>;
	
	ngAfterViewInit() {
        overwolf.windows.obtainDeclaredWindow("SettingsWindow", (result) => {
			if (result.status !== 'success') {
				// console.warn('Could not get SettingsWindow', result);
				this.ngAfterViewInit();
				return;
			}
			this.settingsWindowId = result.window.id;
			this.settingsEventBus = overwolf.windows.getMainWindow().settingsEventBus;
		});
	}

	showSettings() {
		if (this.settingsApp) {
			this.settingsEventBus.next(this.settingsApp);
		}
		overwolf.windows.getCurrentWindow((currentWindoResult) => {
			// console.log('current window', currentWindoResult);
			const center = {
				x: currentWindoResult.window.left + currentWindoResult.window.width / 2,
				y: currentWindoResult.window.top + currentWindoResult.window.height / 2
			};
			// console.log('center is', center);
			if (this.shouldMoveSettingsWindow) {
				overwolf.windows.sendMessage(this.settingsWindowId, 'move', center, (result3) => {
					overwolf.windows.restore(this.settingsWindowId);
				});
			}
			else {
				overwolf.windows.restore(this.settingsWindowId);
			}
		});
	}
}
