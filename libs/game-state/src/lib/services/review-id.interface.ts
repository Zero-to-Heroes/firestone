import { InjectionToken } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export const REVIEW_ID_SERVICE_TOKEN = new InjectionToken<IReviewIdService>('ReviewIdService');
export interface IReviewIdService {
	reviewId$$: BehaviorSubject<string | null>;
}
