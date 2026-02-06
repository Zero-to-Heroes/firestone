import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MainWindowStateFacadeService, MainWindowStoreEvent } from '@firestone/mainwindow/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import { CloseMainWindowEvent } from '../../services/mainwindow/store/events/close-main-window-event';

@Component({
	standalone: false,
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
export class ControlMinimizeComponent {
	@Input() windowId: string;
	@Input() isMainWindow: boolean;
	@Input() eventProvider: () => MainWindowStoreEvent;

	constructor(
		private ow: OverwolfService,
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
	) {}

	async minimizeWindow() {
		const windowName = (await this.ow.getCurrentWindow()).name;
		if (this.isMainWindow) {
			this.mainWindowStateFacade.send(new CloseMainWindowEvent());
		}
		// Delegate all the logic
		if (this.eventProvider) {
			this.eventProvider();
			return;
		}
		this.ow.minimizeWindow(this.windowId);
	}
}
