import { InjectionToken } from '@angular/core';

export const SYSTEM_INFO_SERVICE_TOKEN = new InjectionToken<ISystemInfoService>('SystemInfoService');

export interface SystemInfo {
	PhysicalCPUCount?: number;
	LogicalCPUCount?: number;
	CPUMaxSpeed?: number;
	PhysicalMemoryTotal?: number;
	PhysicalMemoryFree?: number;
	OSVersion?: string;
	OSBuild?: string;
	ComputerName?: string;
	SystemLanguage?: string;
}

export interface ISystemInfoService {
	getSystemInformation(): Promise<SystemInfo | null>;
}
