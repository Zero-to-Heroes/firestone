import { Component, ViewEncapsulation, ChangeDetectionStrategy, Input } from '@angular/core';

const HEARTHSTONE_GAME_ID = 9898;

declare var overwolf: any;

@Component({
	selector: 'control-close',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-close.component.scss`,
	],
	encapsulation: ViewEncapsulation.None,
	template: `
        <button class="i-30 close-button" (click)="closeWindow()">
            <svg class="svg-icon-fill">
                <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_close"></use>
            </svg>
        </button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlCloseComponent {

    @Input() windowId: string;

	closeWindow() {
		// If game is not running, we close all other windows
		overwolf.games.getRunningGameInfo((res: any) => {
			console.log('running game info', res);
			if (!(res && res.isRunning && res.id && Math.floor(res.id / 10) === HEARTHSTONE_GAME_ID)) {
				overwolf.windows.getOpenWindows((openWindows) => {
					for (let windowName in openWindows) {
						overwolf.windows.obtainDeclaredWindow(windowName, (result) => {
							if (result.status !== 'success') {
								return;
							}
							overwolf.windows.close(result.window.id, (result) => {
							})
						});
					}
				})
			}
			else {
				overwolf.windows.hide(this.windowId);
			}
		});
	};
}
