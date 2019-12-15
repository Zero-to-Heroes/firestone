import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { CloseMainWindowEvent } from '../../services/mainwindow/store/events/close-main-window-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';

declare var amplitude;

@Component({
	selector: 'control-close',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-close.component.scss`,
	],
	template: `
		<button (mousedown)="closeWindow()">
			<svg class="svg-icon-fill">
				<use
					xmlns:xlink="https://www.w3.org/1999/xlink"
					xlink:href="/Files/assets/svg/sprite.svg#window-control_close"
				></use>
			</svg>
		</button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlCloseComponent implements AfterViewInit {
	@Input() windowId: string;
	@Input() closeAll: boolean;
	@Input() isMainWindow: boolean;
	@Input() eventProvider: () => MainWindowStoreEvent;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	async closeWindow() {
		const windowName = (await this.ow.getCurrentWindow()).name;
		amplitude.getInstance().logEvent('close', { 'window': windowName });

		if (this.isMainWindow) {
			this.stateUpdater.next(new CloseMainWindowEvent());
		}
		// Delegate all the logic
		if (this.eventProvider) {
			this.stateUpdater.next(this.eventProvider());
			return;
		}
		// If game is not running, we close all other windows
		const isRunning: boolean = await this.ow.inGame();
		if (this.closeAll && !isRunning) {
			const openWindows = await this.ow.getOpenWindows();
			for (const [name] of Object.entries(openWindows)) {
				this.ow.closeWindowFromName(name);
			}
		} else {
			console.log('[control-close] requested window close', this.windowId);
			if (this.isMainWindow) {
				this.ow.hideWindow(this.windowId);
			} else {
				this.ow.closeWindow(this.windowId);
			}
		}
	}
}
