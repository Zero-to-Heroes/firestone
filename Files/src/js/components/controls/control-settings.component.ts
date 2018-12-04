import { Component, ViewEncapsulation, ChangeDetectionStrategy, Input } from '@angular/core';

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
export class ControlSettingsComponent {

    @Input() windowId: string;

	showSettings() {
        console.log('showing settings');
        overwolf.windows.obtainDeclaredWindow("SettingsWindow", (result) => {
			if (result.status !== 'success') {
				console.warn('Could not get SettingsWindow', result);
				return;
			}
			overwolf.windows.getCurrentWindow((currentWindoResult) => {
				// console.log('current window', currentWindoResult);
				const center = {
					x: currentWindoResult.window.left + currentWindoResult.window.width / 2,
					y: currentWindoResult.window.top + currentWindoResult.window.height / 2
				};
				// console.log('center is', center);
				overwolf.windows.sendMessage(result.window.id, 'move', center, (result3) => {
					overwolf.windows.restore(result.window.id, (result2) => { });
				});
			});
		});
	}
}
