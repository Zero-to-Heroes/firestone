import { ChangeDetectionStrategy, Component, Inject, Input } from '@angular/core';
import { MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import {
	IWindowControlsService,
	OverwolfService,
	WINDOW_CONTROLS_SERVICE_TOKEN,
} from '@firestone/shared/framework/core';
import { CloseMainWindowEvent } from '../../services/mainwindow/store/events/close-main-window-event';
import { isWindowClosed } from '../../services/utils';

@Component({
	standalone: false,
	selector: 'control-close',
	styleUrls: [
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-close.component.scss`,
	],
	template: `
		<button
			confirmationTooltip
			[askConfirmation]="askConfirmation"
			(onConfirm)="closeWindow()"
			[attr.aria-label]="'Close app'"
		>
			<svg class="svg-icon-fill">
				<use
					xmlns:xlink="https://www.w3.org/1999/xlink"
					xlink:href="assets/svg/sprite.svg#window-control_close"
				></use>
			</svg>
		</button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlCloseComponent {
	@Input() closeAll: boolean;
	@Input() isMainWindow: boolean;
	@Input() shouldHide: boolean;
	@Input() askConfirmation: boolean;
	@Input() eventProvider: () => void;

	constructor(
		@Inject(WINDOW_CONTROLS_SERVICE_TOKEN) private readonly windowControls: IWindowControlsService,
		private readonly prefs: PreferencesService,
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
	) {}

	async closeWindow() {
		if (this.eventProvider) {
			console.log('delegating closing logic');
			this.eventProvider();
			return;
		}

		if (!this.windowControls?.canControlWindow()) {
			return;
		}

		const currentWindow = await this.windowControls.getCurrentWindow();
		const windowId = currentWindow.id;

		if (this.isMainWindow) {
			this.mainWindowStateFacade.send(new CloseMainWindowEvent());
		}
		// Delegate all the logic
		// If game is not running, we close all other windows
		const isRunning: boolean = await this.windowControls.inGame();
		const [mainWindow, mainWindowOverlay, bgsWindow, bgsWindowOverlay] = await Promise.all([
			this.windowControls.getWindowState(OverwolfService.COLLECTION_WINDOW),
			this.windowControls.getWindowState(OverwolfService.COLLECTION_WINDOW_OVERLAY),
			this.windowControls.getWindowState(OverwolfService.BATTLEGROUNDS_WINDOW),
			this.windowControls.getWindowState(OverwolfService.BATTLEGROUNDS_WINDOW_OVERLAY),
		]);
		const areBothMainAndBgWindowsOpen =
			!isWindowClosed(mainWindow.window_state_ex) &&
			!isWindowClosed(mainWindowOverlay.window_state_ex) &&
			!isWindowClosed(bgsWindow.window_state_ex) &&
			!isWindowClosed(bgsWindowOverlay.window_state_ex);
		if (this.closeAll && !isRunning && !areBothMainAndBgWindowsOpen && windowId) {
			console.log('[control-close] closing all app windows');
			await this.windowControls.hideWindow(windowId);
			const prefs = await this.prefs.getPreferences();
			const openWindows = await this.windowControls.getOpenWindows();
			for (const [name] of Object.entries(openWindows)) {
				if (prefs.closeToTray && name === OverwolfService.MAIN_WINDOW) {
					continue;
				}
				await this.windowControls.closeWindowFromName(name);
			}
		} else {
			console.log('[control-close] requested window close', windowId);
			if (this.shouldHide) {
				await this.windowControls.hideWindow(windowId);
			} else {
				await this.windowControls.closeWindow(windowId);
			}
		}
	}
}
