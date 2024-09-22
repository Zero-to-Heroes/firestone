import { InjectionToken } from '@angular/core';

export const REMOTE_ACHIEVEMENTS_SERVICE_TOKEN = new InjectionToken<IRemoteAchievementsService>(
	'RemoteAchievementsService',
);
export interface IRemoteAchievementsService {
	loadAchievements(): Promise<void>;
}
