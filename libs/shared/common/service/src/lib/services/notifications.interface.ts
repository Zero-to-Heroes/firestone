import { InjectionToken } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export const NOTIFICATIONS_SERVICE_TOKEN = new InjectionToken<INotificationsService>('NotificationsService');
export interface INotificationsService {
	enablePremiumFeatures$$: BehaviorSubject<boolean>;
	hasPremiumSub$$: BehaviorSubject<boolean>;

	isReady(): Promise<void>;
	goToPremium(): Promise<void>;
}
