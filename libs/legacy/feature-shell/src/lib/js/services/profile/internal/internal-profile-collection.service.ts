import { Injectable } from '@angular/core';
import { CardsForSet, ProfilePackStat, ProfileSet } from '@firestone-hs/api-user-profile';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import { CollectionCardType } from '../../../models/collection/collection-card-type.type';
import { Set as CollectionSet } from '../../../models/set';
import { AppUiStoreFacadeService } from '../../ui-store/app-ui-store-facade.service';
import { deepEqual } from '../../utils';

@Injectable()
export class InternalProfileCollectionService {
	public sets$$ = new BehaviorSubject<readonly ProfileSet[]>([]);
	public packsAllTime$$ = new BehaviorSubject<readonly ProfilePackStat[]>([]);

	constructor(private readonly store: AppUiStoreFacadeService) {
		this.init();
	}

	private async init() {
		await this.store.initComplete();
		this.initSets();
		this.initBoosters();
	}

	private initSets() {
		// TODO: don't upload if the collection didn't change since last upload
		const setsToUpload$ = combineLatest([this.store.enablePremiumFeatures$(), this.store.sets$()]).pipe(
			filter(([premium, sets]) => premium),
			// So that we don't spam the server when the user is opening packs
			debounceTime(10000),
			map(([premium, sets]) => {
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
				console.debug('[profile] sets', sets);
				this.sets$$.next(sets);
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

	private initBoosters() {
		const boostersToUpload$ = combineLatest([
			this.store.enablePremiumFeatures$(),
			this.store.allTimeBoosters$(),
		]).pipe(
			filter(([premium, sets]) => premium),
			debounceTime(2000),
			map(([premium, boosters]) => {
				return boosters.map((booster) => {
					return {
						id: booster.packType,
						totalObtained: booster.totalObtained,
					} as ProfilePackStat;
				});
			}),
		);
		boostersToUpload$
			.pipe(
				filter((boosters) => !!boosters?.length),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
			)
			.subscribe(async (boosters) => {
				console.debug('[profile] packsAllTime', boosters);
				this.packsAllTime$$.next(boosters);
			});
	}
}
