import { InjectionToken } from '@angular/core';

export const USER_SERVICE_TOKEN = new InjectionToken<IUserService>('UserService');
export interface IUserService {
	getCurrentUser(): Promise<CurrentUser | null>;
	isReady(): Promise<void>;
}

export interface CurrentUser {
	avatar?: string;
	channel?: string;
	machineId?: string;
	partnerId?: number;
	userId?: string;
	username?: string;
	parameters?: Dictionary<string>;
	installParams?: any;
	installerExtension?: any;
	displayName?: string;
	uuid?: string;
}

interface Dictionary<T> {
	[key: string]: T;
}
