import { Injectable } from '@angular/core';
import { ApiRunner, OverwolfService } from '@firestone/shared/framework/core';
import { combineLatest, debounceTime, filter, map } from 'rxjs';
import { CollectionCardType } from '../../models/collection/collection-card-type.type';
import { Set } from '../../models/set';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';

const PROFILE_UPDATE_URL = 'https://7n2xgqrutsr3by2n2wncsi25ou0mttjp.lambda-url.us-west-2.on.aws/';

@Injectable()
export class ProfileUploaderService {
	constructor(
		private readonly store: AppUiStoreFacadeService,
		private readonly ow: OverwolfService,
		private readonly api: ApiRunner,
	) {
		this.init();
	}

	private async init() {
		await this.store.initComplete();

		const isPremium$ = this.store.isPremiumUser$();
		
		// TODO: don't upload if the collection didn't change since last upload
		const setsToUpload$ = combineLatest([isPremium$, this.store.listen$(([main, _]) => main.binder.allSets)]).pipe(
			filter(([premium, [sets]]) => premium),
			// So that we don't spam the server when the user is opening packs
			debounceTime(10000),
			map(([premium, [sets]]) => {
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
		setsToUpload$.pipe(filter((sets) => !!sets?.length)).subscribe(async (sets) => {
			console.debug('[profile] will upload sets', sets);
			const payload: any /*UserProfileUpdateInput*/ = {
				sets: sets,
			};
			console.debug('[profile] updating profile with payload', payload);
			this.api.callPostApiSecure(PROFILE_UPDATE_URL, payload);
		});
	}

	private buildCardsSetForPremium(set: Set, premium: CollectionCardType): /*CardsForSet*/ any {
		return {
			common: set.ownedForRarity('Common', premium),
			rare: set.ownedForRarity('Rare', premium),
			epic: set.ownedForRarity('Epic', premium),
			legendary: set.ownedForRarity('Legendary', premium),
		};
	}
}
