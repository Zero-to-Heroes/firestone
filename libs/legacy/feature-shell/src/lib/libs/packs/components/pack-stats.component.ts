import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BoosterType } from '@firestone-hs/reference-data';
import { PackResult } from '@firestone-hs/user-packs';
import { combineLatest, Observable } from 'rxjs';
import { AbstractSubscriptionStoreComponent } from '../../../js/components/abstract-subscription-store.component';
import { sets } from '../../../js/services/collection/sets.ref';
import { boosterIdToBoosterName, boosterIdToSetId, getPackDustValue } from '../../../js/services/hs-utils';
import { LocalizationFacadeService } from '../../../js/services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../js/services/ui-store/app-ui-store-facade.service';
import { sortByProperties, sumOnArray } from '../../../js/services/utils';
import { InternalPackInfo } from './pack-stat.component';

@Component({
	selector: 'pack-stats',
	styleUrls: [`./pack-stats.component.scss`],
	template: `
		<div class="pack-stats" scrollable>
			<div class="header">
				{{ 'app.collection.pack-stats.title' | owTranslate: { value: totalPacks$ | async } }}
				<preference-toggle
					class="show-buyable-packs"
					[ngClass]="{ active: showOnlyBuyablePacks$ | async }"
					field="collectionShowOnlyBuyablePacks"
					[label]="'settings.collection.pack-stats-show-only-buyable-packs' | owTranslate"
					[helpTooltip]="'settings.collection.pack-stats-show-only-buyable-packs-tooltip' | owTranslate"
				></preference-toggle>
			</div>
			<div class="pack-groups">
				<div class="pack-group" *ngFor="let group of packGroups$ | async">
					<div class="group-name" *ngIf="!(showOnlyBuyablePacks$ | async)">{{ group.name }}</div>
					<div class="packs-container">
						<pack-stat
							class="pack-stat"
							*ngFor="let pack of group.packs; trackBy: trackByPackFn"
							[pack]="pack"
							[style.width.px]="cardWidth"
							[style.height.px]="cardHeight"
						>
						</pack-stat>
					</div>
				</div>
			</div>
			<ng-container *ngIf="{ bestPacks: bestPacks$ | async } as value">
				<div
					class="header best-packs-header"
					*ngIf="value.bestPacks?.length"
					[helpTooltip]="'app.collection.pack-stats.best-opened-packs-title-tooltip' | owTranslate"
					[owTranslate]="'app.collection.pack-stats.best-opened-packs-title'"
					[translateParams]="{ value: value.bestPacks.length }"
				></div>
				<div class="best-packs-container" *ngIf="value.bestPacks?.length">
					<div class="best-pack" *ngFor="let pack of value.bestPacks">
						<pack-history-item class="info" [historyItem]="pack"></pack-history-item>
						<pack-display class="display" [pack]="pack"></pack-display>
					</div>
				</div>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionPackStatsComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	readonly DEFAULT_CARD_WIDTH = 115;
	readonly DEFAULT_CARD_HEIGHT = 155;

	totalPacks$: Observable<number>;
	showOnlyBuyablePacks$: Observable<boolean>;
	packGroups$: Observable<readonly InternalPackGroup[]>;
	bestPacks$: Observable<readonly PackResult[]>;

	cardWidth = this.DEFAULT_CARD_WIDTH;
	cardHeight = this.DEFAULT_CARD_HEIGHT;

	constructor(
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		this.showOnlyBuyablePacks$ = this.listenForBasicPref$((prefs) => prefs.collectionShowOnlyBuyablePacks);
		const packs$: Observable<readonly InternalPackInfo[]> = combineLatest([
			this.store.listen$(
				([main, nav]) => main.binder.packsFromMemory,
				([main, nav]) => main.binder.packStats,
			),
			this.store.listenPrefs$((prefs) => prefs.collectionPityTimerResets),
		]).pipe(
			this.mapData(([[packsFromMemory, packStats], [collectionPityTimerResets]]) =>
				Object.values(BoosterType)
					.filter((boosterId: BoosterType) => !isNaN(boosterId))
					.filter((boosterId: BoosterType) => !EXCLUDED_BOOSTER_IDS.includes(boosterId))
					.map((boosterId: BoosterType) => {
						const packsForBoosterId = packStats?.filter((p) => p.boosterId === boosterId);
						const packFromMemory = packsFromMemory?.find((p) => p.packType === boosterId);
						const totalPacksReceived = packFromMemory?.totalObtained;
						const unopenedPacks = packFromMemory?.unopened ?? 0;
						const openedPacks = totalPacksReceived - unopenedPacks;
						const pityTimerReset = collectionPityTimerResets[boosterId];
						const result = {
							packType: boosterId,
							totalObtained: totalPacksReceived ?? 0,
							unopened: unopenedPacks,
							name: boosterIdToBoosterName(boosterId, this.i18n),
							setId: boosterIdToSetId(boosterId),
							nextLegendary: buildPityTimer(
								packsForBoosterId,
								'legendary',
								boosterId,
								openedPacks,
								pityTimerReset,
							),
							nextEpic: buildPityTimer(packsForBoosterId, 'epic', boosterId, openedPacks, pityTimerReset),
						} as InternalPackInfo;
						return result;
					})
					.filter((info) => info)
					.reverse(),
			),
		);
		this.packGroups$ = combineLatest(this.showOnlyBuyablePacks$, packs$).pipe(
			this.mapData(([showOnlyBuyablePacks, packs]) => {
				const mainGroupPacks = packs
					.map((pack) => ({
						...pack,
						set: sets.find((set) => set.id === pack.setId),
					}))
					.filter(
						(pack) =>
							!!pack.set ||
							pack.packType === BoosterType.CLASSIC ||
							pack.packType === BoosterType.WILD_PACK ||
							pack.packType === BoosterType.STANDARD_PACK,
					)
					.filter((pack) => !GOLDEN_SET_PACKS.includes(pack.packType))
					.sort(sortByProperties((pack) => [!pack.set, -pack.set?.launchDate?.getTime() ?? 0]));
				const mainSetsGroup: InternalPackGroup = {
					name: this.i18n.translateString('app.collection.pack-stats.main-sets-group-name', {
						totalPacks: sumOnArray(mainGroupPacks, (pack) => pack.totalObtained),
					}),
					packs: mainGroupPacks,
				};

				const nonBuyablePacks = packs
					.map((pack) => ({
						...pack,
						set: sets.find((set) => set.id === pack.setId),
					}))
					.filter((pack) => NON_BUYABLE_BOOSTER_IDS.includes(pack.packType))
					.sort(
						sortByProperties((pack) => [
							!CLASS_PACKS.includes(pack.packType),
							!YEAR_PACKS.includes(pack.packType),
							!pack.set,
							-pack.set?.launchDate?.getTime() ?? 0,
							pack.name,
						]),
					);
				const nonBuyableGroup: InternalPackGroup = {
					name: this.i18n.translateString('app.collection.pack-stats.non-buyable-group-name', {
						totalPacks: sumOnArray(nonBuyablePacks, (pack) => pack.totalObtained),
					}),
					packs: nonBuyablePacks,
				};

				const packIdsInGroups = [...mainSetsGroup.packs, ...nonBuyableGroup.packs].map((pack) => pack.packType);
				const otherGroupPacks = packs
					.filter((pack) => !packIdsInGroups.includes(pack.packType))
					.sort(sortByProperties((pack) => [-pack.packType]));
				const otherGroup: InternalPackGroup = {
					name: this.i18n.translateString('app.collection.pack-stats.other-group-name', {
						totalPacks: sumOnArray(otherGroupPacks, (pack) => pack.totalObtained),
					}),
					packs: otherGroupPacks,
				};
				return [
					mainSetsGroup,
					showOnlyBuyablePacks ? null : nonBuyableGroup,
					showOnlyBuyablePacks ? null : otherGroup,
				].filter((group) => !!group?.packs?.length);
			}),
		);
		this.totalPacks$ = this.packGroups$.pipe(
			this.mapData((groups) =>
				sumOnArray(
					groups.flatMap((group) => group.packs),
					(pack) => pack.totalObtained,
				),
			),
		);
		this.bestPacks$ = this.store
			.listen$(([main, nav, prefs]) => main.binder.packStats)
			.pipe(
				this.mapData(([packStats]) =>
					[...packStats].sort((a, b) => getPackDustValue(b) - getPackDustValue(a)).slice(0, 5),
				),
			);
	}

	trackByPackFn(index: number, item: InternalPackInfo) {
		return item.packType;
	}
}

const EXCLUDED_BOOSTER_IDS = [
	BoosterType.INVALID,
	BoosterType.SIGNUP_INCENTIVE,
	BoosterType.FIRST_PURCHASE,
	BoosterType.FIRST_PURCHASE_OLD,
	BoosterType.MAMMOTH_BUNDLE,
	BoosterType.WAILING_CAVERNS,
	BoosterType.PATH_OF_ARTHAS,
];

const GOLDEN_SET_PACKS = [
	BoosterType.GOLDEN_SCHOLOMANCE,
	BoosterType.GOLDEN_DARKMOON_FAIRE,
	BoosterType.GOLDEN_THE_BARRENS,
	BoosterType.STORMWIND_GOLDEN,
	BoosterType.GOLDEN_THE_SUNKEN_CITY,
	BoosterType.ALTERAC_VALLEY_GOLDEN,
	BoosterType.GOLDEN_REVENDRETH,
	BoosterType.GOLDEN_RETURN_OF_THE_LICH_KING,
];

const CLASS_PACKS = [
	BoosterType.STANDARD_DEATHKNIGHT,
	BoosterType.STANDARD_DEMONHUNTER,
	BoosterType.STANDARD_DRUID,
	BoosterType.STANDARD_HUNTER,
	BoosterType.STANDARD_MAGE,
	BoosterType.STANDARD_PALADIN,
	BoosterType.STANDARD_PRIEST,
	BoosterType.STANDARD_ROGUE,
	BoosterType.STANDARD_SHAMAN,
	BoosterType.STANDARD_WARRIOR,
	BoosterType.STANDARD_WARLOCK,
];

const YEAR_PACKS = [BoosterType.YEAR_OF_DRAGON, BoosterType.YEAR_OF_PHOENIX];

const NON_BUYABLE_BOOSTER_IDS = [
	...GOLDEN_SET_PACKS,
	...CLASS_PACKS,
	...YEAR_PACKS,
	BoosterType.GOLDEN_CLASSIC_PACK,
	BoosterType.GOLDEN_STANDARD_PACK,
	BoosterType.GOLDEN_WILD_PACK,
];

interface InternalPackGroup {
	readonly name: string;
	readonly packs: readonly InternalPackInfo[];
}

export const EPIC_PITY_TIMER = 10;
export const LEGENDARY_PITY_TIMER = 40;
const PACKS_WHITHOUT_GUARANTEED_LEGENDARY = [
	BoosterType.YEAR_OF_DRAGON,
	BoosterType.YEAR_OF_PHOENIX,
	// BoosterType.
];

const buildPityTimer = (
	openedPacks: readonly PackResult[],
	type: 'legendary' | 'epic',
	boosterId: BoosterType,
	totalOpenedPacks: number,
	pityTimerReset: number | null,
): number => {
	const hasAlreadyOpenedLegendary = openedPacks.flatMap((p) => p.cards).some((card) => card.cardRarity === type);
	let valueIfNoPacksOpened =
		type === 'epic'
			? EPIC_PITY_TIMER
			: // Guaranteed legendary in the first 10 packs
			totalOpenedPacks < 10 &&
			  !PACKS_WHITHOUT_GUARANTEED_LEGENDARY.includes(boosterId) &&
			  !hasAlreadyOpenedLegendary
			? 10
			: LEGENDARY_PITY_TIMER;
	for (let i = 0; i < openedPacks.length; i++) {
		if (pityTimerReset != null && new Date(openedPacks[i].creationDate).getTime() < pityTimerReset) {
			break;
		}
		if (openedPacks[i].cards.some((card) => card.cardRarity === type)) {
			break;
		}
		valueIfNoPacksOpened--;
	}
	return valueIfNoPacksOpened;
};
