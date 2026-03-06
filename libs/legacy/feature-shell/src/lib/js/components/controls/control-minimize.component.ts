import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MainWindowStateFacadeService } from '@firestone/mainwindow/common';
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
	@Input() isMainWindow: boolean;

	constructor(
		private ow: OverwolfService,
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
	) {}

	async minimizeWindow() {
		if (!this.ow?.isOwEnabled()) {
			return;
		}
		const currentWindow = await this.ow.getCurrentWindow();
		if (this.isMainWindow) {
			this.mainWindowStateFacade.send(new CloseMainWindowEvent());
		}
		this.ow.minimizeWindow(currentWindow.id);
	}
}
