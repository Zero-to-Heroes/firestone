import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { CloseMainWindowEvent } from '../../services/mainwindow/store/events/close-main-window-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';

declare let amplitude;

@Component({
	selector: 'control-minimize',
	styleUrls: [
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-minimize.component.scss`,
	],
	template: `
		<button
			(mousedown)="minimizeWindow()"
			[attr.aria-label]="'Minimize app'"
			inlineSVG="assets/svg/control_minimize.svg"
		></button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlMinimizeComponent implements AfterViewInit {
	@Input() windowId: string;
	@Input() isMainWindow: boolean;
	@Input() eventProvider: () => MainWindowStoreEvent;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	async minimizeWindow() {
		const windowName = (await this.ow.getCurrentWindow()).name;
		amplitude.getInstance().logEvent('minimize', { window: windowName });

		if (this.isMainWindow) {
			this.stateUpdater.next(new CloseMainWindowEvent());
		}
		// Delegate all the logic
		if (this.eventProvider) {
			this.eventProvider();
			return;
		}
		this.ow.minimizeWindow(this.windowId);
	}
}
