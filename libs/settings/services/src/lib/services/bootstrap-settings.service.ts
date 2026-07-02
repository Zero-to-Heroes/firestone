import { Injectable } from '@angular/core';
import { OverlayAppearanceService } from './overlay-appearance.service';
import { SettingsControllerService } from './settings-controller.service';

@Injectable()
export class BootstrapSettingsService {
	constructor(
		private readonly init_OverlayAppearanceService: OverlayAppearanceService,
		private readonly init_SettingsControllerService: SettingsControllerService,
	) {}
}
