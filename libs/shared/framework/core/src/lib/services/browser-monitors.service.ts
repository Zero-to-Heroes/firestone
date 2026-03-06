import { Injectable } from '@angular/core';
import {
	IMonitorsService,
	MonitorsListResult,
} from './monitors-service.interface';

/**
 * Browser implementation that returns empty displays.
 * Used when neither Overwolf nor Electron is available (e.g. web/coliseum).
 */
@Injectable()
export class BrowserMonitorsService implements IMonitorsService {
	async getMonitorsList(): Promise<MonitorsListResult> {
		return { success: true, displays: [] };
	}
}
