import { InjectionToken } from '@angular/core';

export const MONITORS_SERVICE_TOKEN = new InjectionToken<IMonitorsService>('MonitorsService');

export interface MonitorsListResult {
	success?: boolean;
	displays: Array<{
		id: number;
		/** Overwolf uses handle.value; Electron maps id to handle for compatibility */
		handle?: { value: number };
		name?: string;
		physicalWidth?: number;
		physicalHeight?: number;
		width: number;
		height: number;
		x: number;
		y: number;
		scaleFactor?: number;
	}>;
}

export interface IMonitorsService {
	getMonitorsList(): Promise<MonitorsListResult>;
}
