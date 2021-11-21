import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BoosterType } from '@firestone-hs/reference-data';
import { PackResult } from '@firestone-hs/user-packs';
import { combineLatest, Observable } from 'rxjs';
import { PackInfo } from '../../models/collection/pack-info';
import { boosterIdToBoosterName, getPackDustValue } from '../../services/hs-utils';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { sumOnArray } from '../../services/utils';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

@Component({
	selector: 'pack-stats',
	styleUrls: [`../../../css/global/scrollbar.scss`, `../../../css/component/collection/pack-stats.component.scss`],
	template: `
		<div class="pack-stats" scrollable>
			<div class="header">
				All-time packs ({{ totalPacks$ | async }})
				<preference-toggle
					class="show-buyable-packs"
					[ngClass]="{ 'active': showOnlyBuyablePacks$ | async }"
					field="collectionShowOnlyBuyablePacks"
					label="Only show main packs"
					helpTooltip="Show only the packs that can be bought in the shop, hiding all promotional / reward packs"
				></preference-toggle>
			</div>
			<div
				class="packs-container"
				*ngIf="{ packs: packs$ | async } as value"
				[ngClass]="{ 'empty': !value.packs?.length }"
			>
				<div
					class="pack-stat"
					*ngFor="let pack of value.packs; trackBy: trackByPackFn"
					[ngClass]="{ 'missing': !pack.totalObtained }"
				>
					<div
						class="icon-container"
						[style.width.px]="cardWidth"
						[style.height.px]="cardHeight"
						[helpTooltip]="
							'You received ' +
							pack.totalObtained +
							' ' +
							pack.name +
							' packs since you started playing Hearthstone'
						"
					>
						<img
							class="icon"
							[src]="
								'https://static.zerotoheroes.com/hearthstone/cardPacks/' + pack.packType + '.webp?v=3'
							"
						/>
					</div>
					<div class="value">{{ pack.totalObtained }}</div>
				</div>
			</div>
			<ng-container *ngIf="{ bestPacks: bestPacks$ | async } as value">
				<div
					class="header best-packs-header"
					*ngIf="bestPacks?.length"
					helpTooltip="Best packs you opened with Firestone running"
				>
					Best {{ bestPacks.length }} opened packs
				</div>
				<div class="best-packs-container" *ngIf="bestPacks?.length">
					<div class="best-pack" *ngFor="let pack of bestPacks">
						<pack-history-item class="info" [historyItem]="pack"></pack-history-item>
						<pack-display class="display" [pack]="pack"></pack-display>
					</div>
				</div>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionPackStatsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	readonly DEFAULT_CARD_WIDTH = 115;
	readonly DEFAULT_CARD_HEIGHT = 155;

	totalPacks$: Observable<number>;
	showOnlyBuyablePacks$: Observable<boolean>;
	packs$: Observable<readonly InternalPackInfo[]>;
	bestPacks$: Observable<readonly PackResult[]>;

	cardWidth = this.DEFAULT_CARD_WIDTH;
	cardHeight = this.DEFAULT_CARD_HEIGHT;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		this.showOnlyBuyablePacks$ = this.listenForBasicPref$((prefs) => prefs.collectionShowOnlyBuyablePacks);
		this.packs$ = combineLatest(
			this.showOnlyBuyablePacks$,
			this.store.listen$(([main, nav, prefs]) => main.binder.packs),
		).pipe(
			this.mapData(([showOnlyBuyablePacks, [inputPacks]]) =>
				Object.values(BoosterType)
					.filter((boosterId: BoosterType) => !isNaN(boosterId))
					.filter((boosterId: BoosterType) => !EXCLUDED_BOOSTER_IDS.includes(boosterId))
					.filter(
						(boosterId: BoosterType) =>
							!showOnlyBuyablePacks || !NON_BUYABLE_BOOSTER_IDS.includes(boosterId),
					)
					.map((boosterId: BoosterType) => ({
						packType: boosterId,
						totalObtained: inputPacks.find((p) => p.packType === boosterId)?.totalObtained ?? 0,
						unopened: 0,
						name: boosterIdToBoosterName(boosterId),
					}))
					.filter((info) => info)
					.reverse(),
			),
		);
		this.totalPacks$ = this.packs$.pipe(this.mapData((packs) => sumOnArray(packs, (pack) => pack.totalObtained)));
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
];

const NON_BUYABLE_BOOSTER_IDS = [
	BoosterType.INVALID,
	BoosterType.FIRST_PURCHASE_OLD,
	BoosterType.FIRST_PURCHASE,
	BoosterType.SIGNUP_INCENTIVE,
	BoosterType.GOLDEN_CLASSIC_PACK,
	BoosterType.GOLDEN_SCHOLOMANCE,
	BoosterType.GOLDEN_DARKMOON_FAIRE,
	BoosterType.GOLDEN_THE_BARRENS,
	BoosterType.GOLDEN_STORMWIND,
	BoosterType.MAMMOTH_BUNDLE,
	BoosterType.YEAR_OF_DRAGON,
	BoosterType.YEAR_OF_PHOENIX,
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
	BoosterType.STANDARD_BUNDLE,
	BoosterType.GOLDEN_STANDARD_BUNDLE,
	BoosterType.WILD_PACK,
];

interface InternalPackInfo extends PackInfo {
	readonly name: string;
}
