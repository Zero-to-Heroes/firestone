import { Component, ViewEncapsulation, ChangeDetectionStrategy, Input, AfterViewInit, EventEmitter } from '@angular/core';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { CloseMainWindowEvent } from '../../services/mainwindow/store/events/close-main-window-event';

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
        <button class="i-30 close-button" (mousedown)="closeWindow()">
            <svg class="svg-icon-fill">
                <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_close"></use>
            </svg>
        </button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlCloseComponent implements AfterViewInit {

	@Input() windowId: string;
	@Input() closeAll: boolean;
	@Input() isMainWindow: boolean;
	
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	ngAfterViewInit() {
		this.stateUpdater = overwolf.windows.getMainWindow().mainWindowStoreUpdater;
	}

	closeWindow() {
		if (this.isMainWindow) {
			this.stateUpdater.next(new CloseMainWindowEvent());
		}
		// If game is not running, we close all other windows
		overwolf.games.getRunningGameInfo((res: any) => {
			console.log('running game info', res);
			if (this.closeAll && !(res && res.isRunning && res.id && Math.floor(res.id / 10) === HEARTHSTONE_GAME_ID)) {
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
