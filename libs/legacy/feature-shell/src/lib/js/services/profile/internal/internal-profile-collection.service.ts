import { Inject, Injectable } from '@angular/core';
import { CardsForSet, ProfilePackStat, ProfileSet } from '@firestone-hs/api-user-profile';
import { SceneMode } from '@firestone-hs/reference-data';
import { CollectionCardType } from '@firestone-hs/user-packs';
import { Set as CollectionSet } from '@firestone/collection/common';
import { SceneService } from '@firestone/memory';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { ADS_SERVICE_TOKEN, IAdsService, waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, debounceTime, distinctUntilChanged, filter, map, take } from 'rxjs';
import { CollectionManager, SetsManagerService } from '@firestone/collection/services';
import { equalProfilePackStat, equalProfileSet } from '../profile-uploader.service';

@Injectable()
export class InternalProfileCollectionService {
	public sets$$ = new SubscriberAwareBehaviorSubject<readonly ProfileSet[]>([]);
	public packsAllTime$$ = new SubscriberAwareBehaviorSubject<readonly ProfilePackStat[]>([]);

	constructor(
		private readonly sceneService: SceneService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		private readonly sets: SetsManagerService,
		private readonly collectionManager: CollectionManager,
	) {
		this.init();
	}

	private async init() {
		await waitForReady(this.sceneService, this.ads, this.sets, this.collectionManager);

		this.sets$$.onFirstSubscribe(() => {
			combineLatest([this.sceneService.currentScene$$, this.ads.enablePremiumFeatures$$])
				.pipe(
					// I don't have a good way to detect when the Journal is being opened
					filter(([scene, premium]) => premium && [SceneMode.COLLECTIONMANAGER].includes(scene)),
					take(1),
				)
				.subscribe(() => {
					this.initSets();
				});
		});
		this.packsAllTime$$.onFirstSubscribe(() => {
			combineLatest([this.sceneService.currentScene$$, this.ads.enablePremiumFeatures$$])
				.pipe(
					// I don't have a good way to detect when the Journal is being opened
					filter(([scene, premium]) => premium && [SceneMode.COLLECTIONMANAGER].includes(scene)),
					take(1),
				)
				.subscribe(() => {
					this.initBoosters();
				});
		});
	}

	private initSets() {
		const setsToUpload$ = combineLatest([this.ads.enablePremiumFeatures$$, this.sets.sets$$]).pipe(
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
				distinctUntilChanged(
					(a, b) => a?.length === b?.length && !!a?.every((info, index) => equalProfileSet(info, b[index])),
				),
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
			this.ads.enablePremiumFeatures$$,
			this.collectionManager.allTimeBoosters$$,
		]).pipe(
			filter(([premium, sets]) => premium),
			debounceTime(2000),
			map(([premium, boosters]) => {
				return (
					boosters?.map((booster) => {
						return {
							id: booster.packType,
							totalObtained: booster.totalObtained,
						} as ProfilePackStat;
					}) ?? []
				);
			}),
		);
		boostersToUpload$
			.pipe(
				filter((boosters) => !!boosters?.length),
				distinctUntilChanged(
					(a, b) =>
						a?.length === b?.length && !!a?.every((info, index) => equalProfilePackStat(info, b[index])),
				),
			)
			.subscribe(async (boosters) => {
				console.debug('[profile] packsAllTime', boosters);
				this.packsAllTime$$.next(boosters);
			});
	}
}
