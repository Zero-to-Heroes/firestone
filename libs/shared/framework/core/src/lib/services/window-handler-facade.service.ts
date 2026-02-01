import { Injectable } from '@angular/core';
import { AbstractFacadeService } from './abstract-facade-service';
import { AppInjector } from './app-injector';
import { IWindowHandlerService, WINDOW_HANDLER_SERVICE_TOKEN } from './window-handler.interface';
import { WindowManagerService } from './window-manager.service';

const USER_MAPPING_UPDATE_URL = 'https://gpiulkkg75uipxcgcbfr4ixkju0ntere.lambda-url.us-west-2.on.aws/';

@Injectable({ providedIn: 'root' })
export class WindowHandlerFacadeService extends AbstractFacadeService<WindowHandlerFacadeService> {
	private windowHandler: IWindowHandlerService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'WindowHandlerFacadeService', () => !!this.windowHandler);
	}

	protected override assignSubjects() {
		// Nothing to do
	}

	protected async init() {
		this.windowHandler = AppInjector.get(WINDOW_HANDLER_SERVICE_TOKEN);
	}

	protected override async initElectronMainProcess() {
		this.registerMainProcessMethod('showSettingsWindowInternal', (useOverlay: boolean) =>
			this.showSettingsWindowInternal(useOverlay),
		);
	}

	public showSettingsWindow(useOverlay: boolean) {
		this.callOnMainProcess('showSettingsWindowInternal', useOverlay);
	}
	private async showSettingsWindowInternal(useOverlay: boolean) {
		this.windowHandler.openSettingsWindow(useOverlay);
	}
}
