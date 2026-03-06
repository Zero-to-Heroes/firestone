import { InjectionToken } from '@angular/core';

export const REGION_INFO_SERVICE_TOKEN = new InjectionToken<IRegionInfoService>('RegionInfoService');

export interface RegionInfoResult {
	success: boolean;
	region?: string;
	country?: string;
	language?: string;
	timezone?: string;
}

export interface IRegionInfoService {
	getRegionInfo(): Promise<RegionInfoResult>;
}
