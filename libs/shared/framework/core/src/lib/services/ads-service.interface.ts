import { InjectionToken } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export const ADS_SERVICE_TOKEN = new InjectionToken<IAdsService>('AdsService');
export interface IAdsService {
	showAds$$: BehaviorSubject<boolean>;
	enablePremiumFeatures$$: BehaviorSubject<boolean>;
	hasPremiumSub$$: BehaviorSubject<boolean>;

	isReady(): Promise<void>;
}
