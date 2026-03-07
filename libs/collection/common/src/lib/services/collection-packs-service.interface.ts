import { InjectionToken } from '@angular/core';
import { PackResult } from '@firestone-hs/user-packs';

export const COLLECTION_PACK_SERVICE_TOKEN = new InjectionToken<ICollectionPackService>('CollectionPackService');
export const PACK_STATS_UPDATED_HANDLER = new InjectionToken<IPackStatsUpdatedHandler>(
	'PackStatsUpdatedHandler',
);
export interface IPackStatsUpdatedHandler {
	onPacksUpdated(packs: readonly PackResult[]): void;
}
export interface ICollectionPackService {
	getPackStats(): Promise<readonly PackResult[]>;
	refreshPackStats(): Promise<void>;
}
