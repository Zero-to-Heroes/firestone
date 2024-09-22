import { InjectionToken } from '@angular/core';

export const COLLECTION_PACK_SERVICE_TOKEN = new InjectionToken<ICollectionPackService>('CollectionPackService');
export interface ICollectionPackService {
	refreshPackStats(): Promise<void>;
}
