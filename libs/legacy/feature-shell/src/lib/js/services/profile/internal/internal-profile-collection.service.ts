import { Injectable } from '@angular/core';
import { CardsForSet, Profile } from '@firestone-hs/api-user-profile';
import { ApiRunner } from '@firestone/shared/framework/core';
import { combineLatest, debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import { CollectionCardType } from '../../../models/collection/collection-card-type.type';
import { Set as CollectionSet } from '../../../models/set';
import { AppUiStoreFacadeService } from '../../ui-store/app-ui-store-facade.service';
import { deepEqual } from '../../utils';
import { PROFILE_UPDATE_URL } from '../profile-uploader.service';

@Injectable()
export class InternalProfileCollectionService {
	constructor(private readonly store: AppUiStoreFacadeService, private readonly api: ApiRunner) {
		this.init();
	}

	private async init() {
		await this.store.initComplete();
		this.initSets();
	}

	private initSets() {
		// TODO: don't upload if the collection didn't change since last upload
		const setsToUpload$ = combineLatest([this.store.isPremiumUser$(), this.store.sets$()]).pipe(
			filter(([premium, sets]) => premium),
			// So that we don't spam the server when the user is opening packs
			debounceTime(10000),
			map(([premium, sets]) => {
				console.debug('[profile] sets', sets);
				return sets.map((set) => {
					return {
						id: set.id,
						global: this.buildCardsSetForPremium(set, null),
						vanilla: this.buildCardsSetForPremium(set, 'NORMAL'),
						golden: this.buildCardsSetForPremium(set, 'GOLDEN'),
						diamond: this.buildCardsSetForPremium(set, 'DIAMOND'),
						signature: this.buildCardsSetForPremium(set, 'SIGNATURE'),
					};
				});
			}),
		);
		setsToUpload$
			.pipe(
				filter((sets) => !!sets?.length),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
			)
			.subscribe(async (sets) => {
				console.debug('[profile] will upload sets', sets);
				const payload: Profile = {
					sets: sets,
				};
				console.debug('[profile] updating profile with payload', payload);
				this.api.callPostApiSecure(PROFILE_UPDATE_URL, payload);
			});
	}

	private buildCardsSetForPremium(set: CollectionSet, premium: CollectionCardType): CardsForSet {
		return {
			common: set.ownedForRarity('Common', premium),
			rare: set.ownedForRarity('Rare', premium),
			epic: set.ownedForRarity('Epic', premium),
			legendary: set.ownedForRarity('Legendary', premium),
		};
	}
}
