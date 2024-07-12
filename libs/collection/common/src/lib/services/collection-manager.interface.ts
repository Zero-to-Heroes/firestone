import { InjectionToken } from '@angular/core';
import { Card } from '@firestone/memory';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';

export const COLLECTION_MANAGER_SERVICE_TOKEN = new InjectionToken<ICollectionManagerService>(
	'CollectionManagerService',
);
export interface ICollectionManagerService {
	readonly collection$$: SubscriberAwareBehaviorSubject<readonly Card[]>;
}
