import { InjectionToken } from '@angular/core';

export const APP_VERSION_SERVICE_TOKEN = new InjectionToken<IAppVersionService>('AppVersionService');
export interface IAppVersionService {
	getAppVersion(): Promise<{ app: string; version: string }>;
}
