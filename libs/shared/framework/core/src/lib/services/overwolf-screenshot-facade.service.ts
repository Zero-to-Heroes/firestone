import { Injectable } from '@angular/core';
import { IScreenshotService } from './screenshot-service.interface';
import { OwUtilsService } from './ow-utils.service';

/**
 * Overwolf implementation of screenshot. Delegates to OwUtilsService.
 */
@Injectable()
export class OverwolfScreenshotFacadeService implements IScreenshotService {
	constructor(private readonly owUtils: OwUtilsService) {}

	async captureWindow(windowName: string, copyToClipboard = false): Promise<[string | null, unknown]> {
		return this.owUtils.captureWindow(windowName, copyToClipboard);
	}
}
