import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BoosterType, boosterIdToBoosterName, boosterIdToSetId, sets } from '@firestone-hs/reference-data';
import { PackResult } from '@firestone-hs/user-packs';
import {
	CATCH_UP_PACK_IDS,
	CLASS_PACKS,
	EXCLUDED_BOOSTER_IDS,
	GOLDEN_FORMAT_PACKS,
	GOLDEN_SET_PACKS,
	GOLDEN_YEAR_PACKS,
	InternalPackInfo,
	NON_BUYABLE_BOOSTER_IDS,
	YEAR_PACKS,
} from '@firestone/collection/view';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CollectionManager } from '@legacy-import/src/lib/js/services/collection/collection-manager.service';
import { getPackDustValue } from '@legacy-import/src/lib/js/services/collection/collection-utils';
import { CollectionBootstrapService } from '@legacy-import/src/lib/js/services/mainwindow/store/collection-bootstrap.service';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { LocalizationFacadeService } from '../../../js/services/localization-facade.service';
import { sortByProperties, sumOnArray } from '../../../js/services/utils';

@Component({
	standalone: false,
	selector: 'pack-stats',
	styleUrls: [`./pack-stats.component.scss`],
	template: `
		<section class="section">
			<ul class="menu-selection">
				<li [ngClass]="{ selected: (currentTab$ | async) == 'stats' }" (mousedown)="selectTab('stats')">
					<span [fsTranslate]="'app.collection.pack-stats.menu.stats'"></span>
				</li>
				<li
					[ngClass]="{ selected: (currentTab$ | async) == 'pack-contents' }"
					(mousedown)="selectTab('pack-contents')"
				>
					<span [fsTranslate]="'app.collection.pack-stats.menu.pack-contents'"></span>
				</li>
			</ul>
			<div class="pack-stats" scrollable>
				<ng-container *ngIf="(currentTab$ | async) == 'stats'">
					<div class="header">
						{{ 'app.collection.pack-stats.title' | owTranslate: { value: totalPacks$ | async } }}
						<preference-toggle
							class="show-buyable-packs"
							[ngClass]="{ active: showOnlyBuyablePacks$ | async }"
							field="collectionShowOnlyBuyablePacks"
							[label]="'settings.collection.pack-stats-show-only-buyable-packs' | owTranslate"
							[helpTooltip]="
								'settings.collection.pack-stats-show-only-buyable-packs-tooltip' | owTranslate
							"
						></preference-toggle>
					</div>
					<div class="pack-groups">
						<div class="pack-group" *ngFor="let group of packGroups$ | async">
							<div class="group-name" *ngIf="!(showOnlyBuyablePacks$ | async)">{{ group.name }}</div>
							<div class="packs-container">
								<pack-stat
									class="pack-stat"
									*ngFor="let pack of group.packs; trackBy: trackByPackFn"
									[attr.data-id]="pack.packType"
									[pack]="pack"
									[style.width.px]="cardWidth"
									[style.height.px]="cardHeight"
								>
								</pack-stat>
							</div>
						</div>
					</div>
				</ng-container>
				<ng-container *ngIf="(currentTab$ | async) == 'pack-contents'">
					<ng-container *ngIf="{ bestPacks: bestPacks$ | async } as value">
						<!-- <div
							class="header best-packs-header"
							*ngIf="value.bestPacks?.length"
							[helpTooltip]="'app.collection.pack-stats.best-opened-packs-title-tooltip' | owTranslate"
							[owTranslate]="'app.collection.pack-stats.best-opened-packs-title'"
							[translateParams]="{ value: '' }"
						></div> -->
						<virtual-scroller
							#scroll
							*ngIf="value.bestPacks?.length"
							[items]="value.bestPacks!"
							[bufferAmount]="5"
							role="list"
							class="best-packs-container"
							scrollable
						>
							<div class="best-pack" *ngFor="let pack of scroll.viewPortItems; trackBy: trackByPackFn">
								<pack-history-item class="info" [historyItem]="pack"></pack-history-item>
								<pack-display class="display" [pack]="pack"></pack-display>
							</div>
						</virtual-scroller>
					</ng-container>
				</ng-container>
			</div>
		</section>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionPackStatsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	readonly DEFAULT_CARD_WIDTH = 115;
	readonly DEFAULT_CARD_HEIGHT = 155;

	currentTab$: Observable<string>;
	totalPacks$: Observable<number>;
	showOnlyBuyablePacks$: Observable<boolean>;
	packGroups$: Observable<readonly InternalPackGroup[]>;
	bestPacks$: Observable<PackResult[]>;

	cardWidth = this.DEFAULT_CARD_WIDTH;
	cardHeight = this.DEFAULT_CARD_HEIGHT;

	private currentTab$$ = new BehaviorSubject<string>('stats');

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
		private readonly collectionManager: CollectionManager,
		private readonly collectionBootstrapService: CollectionBootstrapService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await Promise.all([
			this.prefs.isReady(),
			this.collectionManager.isReady(),
			this.collectionBootstrapService.isReady(),
		]);

		this.showOnlyBuyablePacks$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.collectionShowOnlyBuyablePacks),
		);
		const packs$: Observable<readonly InternalPackInfo[]> = combineLatest([
			this.collectionManager.allTimeBoosters$$,
			this.collectionBootstrapService.packStats$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.collectionPityTimerResets)),
		]).pipe(
			this.mapData(([packsFromMemory, packStats, collectionPityTimerResets]) =>
				Object.values(BoosterType)
					.filter((boosterId: BoosterType) => !isNaN(boosterId))
					.filter((boosterId: BoosterType) => !EXCLUDED_BOOSTER_IDS.includes(boosterId))
					.map((boosterId: BoosterType) => {
						const packsForBoosterId = packStats?.filter((p) => p.boosterId === boosterId);
						const packFromMemory = packsFromMemory?.find((p) => p.packType === boosterId);
						const totalPacksReceived = packFromMemory?.totalObtained ?? 0;
						const unopenedPacks = packFromMemory?.unopened ?? 0;
						const openedPacks = totalPacksReceived - unopenedPacks;
						const pityTimerReset = collectionPityTimerResets[boosterId];
						const result = {
							packType: boosterId,
							totalObtained: totalPacksReceived ?? 0,
							unopened: unopenedPacks,
							// TODO: use Booster json file?
							name: boosterIdToBoosterName(boosterId, this.i18n),
							setId: boosterIdToSetId(boosterId),
							nextLegendary: buildPityTimer(
								packsForBoosterId,
								'legendary',
								GOLDEN_SET_PACKS.includes(boosterId) ? 'GOLDEN' : 'NORMAL',
								boosterId,
								openedPacks,
								pityTimerReset,
							),
							nextEpic: buildPityTimer(
								packsForBoosterId,
								'epic',
								GOLDEN_SET_PACKS.includes(boosterId) ? 'GOLDEN' : 'NORMAL',
								boosterId,
								openedPacks,
								pityTimerReset,
							),
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
					.sort(sortByProperties((pack) => [!pack.set, -(pack.set?.launchDate?.getTime() ?? 0)]));
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
					.filter(
						(pack) =>
							NON_BUYABLE_BOOSTER_IDS.includes(pack.packType) ||
							CATCH_UP_PACK_IDS.includes(pack.packType),
					)
					.sort(
						sortByProperties((pack) => [
							!CLASS_PACKS.includes(pack.packType),
							!YEAR_PACKS.includes(pack.packType),
							!GOLDEN_SET_PACKS.includes(pack.packType),
							!GOLDEN_YEAR_PACKS.includes(pack.packType),
							!GOLDEN_FORMAT_PACKS.includes(pack.packType),
							!CATCH_UP_PACK_IDS.includes(pack.packType),
							-(pack.set?.launchDate?.getTime() ?? 0),
							!pack.set,
							// pack.name,
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
		this.bestPacks$ = this.collectionBootstrapService.packStats$$.pipe(
			this.mapData(
				(packStats) =>
					packStats
						.filter((p) => !CATCH_UP_PACK_IDS.includes(p.boosterId))
						.sort((a, b) => getPackDustValue(b) - getPackDustValue(a)),
				// .slice(0, 5),
			),
		);

		this.currentTab$ = this.currentTab$$.pipe(this.mapData((tab) => tab));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByPackFn(index: number, item: InternalPackInfo) {
		return item.packType;
	}

	selectTab(tab: string) {
		this.currentTab$$.next(tab);
	}
}

interface InternalPackGroup {
	readonly name: string;
	readonly packs: readonly InternalPackInfo[];
}

export const EPIC_PITY_TIMER = 10;
export const LEGENDARY_PITY_TIMER = 40;
const PACKS_WHITHOUT_GUARANTEED_LEGENDARY = [
	BoosterType.YEAR_OF_DRAGON,
	BoosterType.YEAR_OF_PHOENIX,
	BoosterType.STANDARD_DEMONHUNTER,
	BoosterType.STANDARD_DEATHKNIGHT,
	BoosterType.STANDARD_DRUID,
	BoosterType.STANDARD_HUNTER,
	BoosterType.STANDARD_MAGE,
	BoosterType.STANDARD_PALADIN,
	BoosterType.STANDARD_PRIEST,
	BoosterType.STANDARD_ROGUE,
	BoosterType.STANDARD_SHAMAN,
	BoosterType.STANDARD_WARLOCK,
	BoosterType.STANDARD_WARRIOR,
	BoosterType.WHIZBANG_CATCH_UP,
	BoosterType.ISLAND_VACATION_CATCH_UP,
	BoosterType.THE_GREAT_DARK_BEYOND_CATCH_UP,
	BoosterType.INTO_THE_EMERALD_DREAM_CATCH_UP,
];

const buildPityTimer = (
	openedPacks: readonly PackResult[],
	type: 'legendary' | 'epic',
	quality: 'NORMAL' | 'GOLDEN',
	boosterId: BoosterType,
	totalOpenedPacks: number,
	pityTimerReset: number | null,
): number => {
	const hasAlreadyOpenedLegendary = openedPacks
		.flatMap((p) => p.cards)
		.some((card) => card.cardRarity === type && card.cardType === quality);
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
		if (openedPacks[i].cards.some((card) => card.cardRarity === type && card.cardType === quality)) {
			break;
		}
		valueIfNoPacksOpened--;
	}
	return valueIfNoPacksOpened;
};
