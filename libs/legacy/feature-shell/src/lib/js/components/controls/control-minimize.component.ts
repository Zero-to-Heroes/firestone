import { ChangeDetectionStrategy, Component, Inject, Input } from '@angular/core';
import { MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { IWindowControlsService, WINDOW_CONTROLS_SERVICE_TOKEN } from '@firestone/shared/framework/core';
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
		@Inject(WINDOW_CONTROLS_SERVICE_TOKEN) private readonly windowControls: IWindowControlsService,
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
	) {}

	async minimizeWindow() {
		if (!this.windowControls?.canControlWindow()) {
			return;
		}
		const currentWindow = await this.windowControls.getCurrentWindow();
		if (this.isMainWindow) {
			this.mainWindowStateFacade.send(new CloseMainWindowEvent());
		}
		await this.windowControls.minimizeWindow(currentWindow.id);
	}
}
