import { Inject, Injectable } from '@angular/core';
import type { IOwUtilsService } from './ow-utils-service.interface';
import { OW_UTILS_SERVICE_TOKEN } from './ow-utils-service.interface';
import { IScreenshotService } from './screenshot-service.interface';

/**
 * Overwolf implementation of screenshot. Delegates to OwUtilsService.
 */
@Injectable()
export class OverwolfScreenshotFacadeService implements IScreenshotService {
	constructor(@Inject(OW_UTILS_SERVICE_TOKEN) private readonly owUtils: IOwUtilsService) {}

	async captureWindow(windowName: string, copyToClipboard = false): Promise<[string | null, unknown]> {
		return this.owUtils.captureWindow(windowName, copyToClipboard);
	}
}
