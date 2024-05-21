import { Injectable } from '@angular/core';
import { CustomAppearanceService } from './custom-appearance.service';

@Injectable()
export class BootstrapSettingsService {
	constructor(private readonly init_CustomAppearanceService: CustomAppearanceService) {}
}
