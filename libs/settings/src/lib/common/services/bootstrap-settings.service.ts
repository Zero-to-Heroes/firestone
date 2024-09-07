import { Injectable } from '@angular/core';
import { CustomAppearanceService } from './custom-appearance.service';
import { SettingsControllerService } from './settings-controller.service';

@Injectable()
export class BootstrapSettingsService {
	constructor(
		private readonly init_CustomAppearanceService: CustomAppearanceService,
		private readonly init_SettingsControllerService: SettingsControllerService,
	) {}
}
