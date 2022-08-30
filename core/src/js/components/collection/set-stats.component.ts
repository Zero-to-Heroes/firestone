import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { PackResult } from '@firestone-hs/user-packs';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { Set } from '../../models/set';
import {
	boosterIdToSetId,
	dustFor,
	dustForPremium,
	dustToCraftFor,
	dustToCraftForPremium,
	getPackDustValue,
} from '../../services/hs-utils';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';
import { InputPieChartData } from '../common/chart/input-pie-chart-data';

@Component({
	selector: 'set-stats',
	styleUrls: [
		`../../../css/global/scrollbar.scss`,
		`../../../css/global/forms.scss`,
		`../../../css/global/toggle.scss`,
		`../../../css/component/collection/set-stats.component.scss`,
	],
	template: `
		<div class="set-stats">
			<div class="top-container">
				<div class="title" [owTranslate]="'app.collection.set-stats.title'"></div>
				<section class="toggle-label">
					<preference-toggle
						field="collectionSetShowGoldenStats"
						[label]="'settings.collection.set-show-golden-stats' | owTranslate"
					></preference-toggle>
				</section>
			</div>
			<div class="stats" scrollable>
				<set-stat-cell
					*ngFor="let stat of stats$ | async"
					[text]="stat.text"
					[current]="stat.current"
					[total]="stat.total"
					[helpTooltip]="stat.tooltip"
				></set-stat-cell>
				<pie-chart [data]="pieChartData$ | async"></pie-chart>
				<set-stat-cell
					*ngIf="packsReceived$ | async as packsReceived"
					[text]="'app.collection.set-stats.packs-received' | owTranslate"
					[current]="packsReceived"
					[helpTooltip]="'app.collection.set-stats.packs-received-tooltip' | owTranslate"
				></set-stat-cell>
				<div class="set-stat-cell">
					<div class="text" [owTranslate]="'app.collection.set-stats.best-known-pack'"></div>
					<div class="value">
						<div class="item">
							<div class="dust">{{ bestKnownPackDust$ | async }}</div>
							<div class="icon" inlineSVG="assets/svg/rewards/reward_dust.svg"></div>
						</div>
					</div>
				</div>
				<pack-display [pack]="bestKnownPack" *ngIf="bestKnownPack$ | async as bestKnownPack"></pack-display>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetStatsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	stats$: Observable<readonly Stat[]>;
	pieChartData$: Observable<readonly InputPieChartData[]>;
	packsReceived$: Observable<number>;
	bestKnownPackDust$: Observable<number>;
	bestKnownPack$: Observable<PackResult>;

	@Input() set set(value: Set) {
		this.set$$.next(value);
	}

	set$$ = new BehaviorSubject<Set>(null);

	constructor(
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		const showGoldenStats$ = this.listenForBasicPref$((prefs) => prefs.collectionSetShowGoldenStats);
		this.stats$ = combineLatest(this.set$$.asObservable(), showGoldenStats$).pipe(
			this.mapData(([set, showGoldenStats]) =>
				showGoldenStats ? this.buildGoldenStats(set) : this.buildStats(set),
			),
		);
		this.pieChartData$ = combineLatest(this.set$$.asObservable(), showGoldenStats$).pipe(
			this.mapData(([set, showGoldenStats]) =>
				showGoldenStats ? this.buildGoldenPieChartData(set) : this.buildPieChartData(set),
			),
		);
		this.packsReceived$ = combineLatest(
			this.set$$.asObservable(),
			this.store.listen$(([main, nav, prefs]) => main.binder.packs),
		).pipe(
			this.mapData(
				([set, [packs]]) =>
					packs.find((pack) => boosterIdToSetId(pack.packType) === set.id)?.totalObtained ?? 0,
			),
		);
		this.bestKnownPack$ = combineLatest(
			this.set$$.asObservable(),
			this.store.listen$(([main, nav, prefs]) => main.binder.packStats),
		).pipe(
			this.mapData(([set, [packStats]]) => {
				const resultForSetId = [...packStats]
					.filter((pack) => pack.setId === set.id)
					.sort((a, b) => getPackDustValue(b) - getPackDustValue(a))[0];
				const resultForBoosterId = [...packStats]
					.filter((pack) => boosterIdToSetId(pack.boosterId) === set.id)
					.sort((a, b) => getPackDustValue(b) - getPackDustValue(a))[0];
				// Needed for old data, from before the boosterId was supported
				const finalResult = resultForBoosterId ?? resultForSetId;
				return finalResult;
			}),
		);
		this.bestKnownPackDust$ = this.bestKnownPack$.pipe(
			this.mapData((bestKnownPack) => (!!bestKnownPack ? getPackDustValue(bestKnownPack) : 0)),
		);
	}

	private buildPieChartData(set: Set): readonly InputPieChartData[] {
		return [
			{
				label: this.i18n.translateString('app.collection.set-stats.commons'),
				data: this.getOwned(set, 'common'),
				color: 'rgba(217, 195, 171, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.commons-missing'),
				data: this.getTotal(set, 'common') - this.getOwned(set, 'common'),
				color: 'rgba(135, 121, 106, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.rares'),
				data: this.getOwned(set, 'rare'),
				color: 'rgba(64, 78, 211, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.rares-missing'),
				data: this.getTotal(set, 'rare') - this.getOwned(set, 'rare'),
				color: 'rgba(40, 49, 130, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.epics'),
				data: this.getOwned(set, 'epic'),
				color: 'rgba(162, 118, 175, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.epics-missing'),
				data: this.getTotal(set, 'epic') - this.getOwned(set, 'epic'),
				color: 'rgba(106, 78, 114, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.legendaries'),
				data: this.getOwned(set, 'legendary'),
				color: 'rgba(233, 169, 67, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.legendaries-missing'),
				data: this.getTotal(set, 'legendary') - this.getOwned(set, 'legendary'),
				color: 'rgba(150, 107, 43, 1)',
			},
		];
	}

	private buildGoldenPieChartData(set: Set): readonly InputPieChartData[] {
		return [
			{
				label: this.i18n.translateString('app.collection.set-stats.golden-commons'),
				data: this.getOwned(set, 'common', true),
				color: 'rgba(217, 195, 171, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.golden-commons-missing'),
				data: this.getTotal(set, 'common', true) - this.getOwned(set, 'common', true),
				color: 'rgba(135, 121, 106, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.golden-rares'),
				data: this.getOwned(set, 'rare', true),
				color: 'rgba(64, 78, 211, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.golden-rares-missing'),
				data: this.getTotal(set, 'rare', true) - this.getOwned(set, 'rare', true),
				color: 'rgba(40, 49, 130, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.golden-epics'),
				data: this.getOwned(set, 'epic', true),
				color: 'rgba(162, 118, 175, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.golden-epics-missing'),
				data: this.getTotal(set, 'epic', true) - this.getOwned(set, 'epic', true),
				color: 'rgba(106, 78, 114, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.golden-legendaries'),
				data: this.getOwned(set, 'legendary', true),
				color: 'rgba(233, 169, 67, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.golden-legendaries-missing'),
				data: this.getTotal(set, 'legendary', true) - this.getOwned(set, 'legendary', true),
				color: 'rgba(150, 107, 43, 1)',
			},
		];
	}

	private buildStats(set: Set): readonly Stat[] {
		const currentDust = set.allCards
			.map((card) => dustToCraftFor(card.rarity) * card.getNumberCollected())
			.reduce((a, b) => a + b, 0);
		const totalDust = set.allCards
			.map((card) => dustToCraftFor(card.rarity) * card.getMaxCollectible())
			.reduce((a, b) => a + b, 0);
		const duplicateDust = set.allCards
			.map((card) => dustFor(card.rarity) * Math.max(0, card.ownedNonPremium - card.getMaxCollectible()))
			.reduce((a, b) => a + b, 0);
		return [
			{
				text: this.i18n.translateString('app.collection.set-stats.dust'),
				current: currentDust,
				total: totalDust,
				tooltip: this.i18n.translateString('app.collection.set-stats.dust-tooltip', {
					value: (totalDust - currentDust).toLocaleString(),
				}),
			},
			{
				text: this.i18n.translateString('app.collection.set-stats.duplicate-dust'),
				current: duplicateDust,
				total: undefined,
				tooltip: this.i18n.translateString('app.collection.set-stats.duplicate-dust-tooltip', {
					value: duplicateDust.toLocaleString(),
				}),
			},
			{
				text: this.i18n.translateString('app.collection.set-stats.commons'),
				current: this.getOwned(set, 'common'),
				total: this.getTotal(set, 'common'),
			},
			{
				text: this.i18n.translateString('app.collection.set-stats.rares'),
				current: this.getOwned(set, 'rare'),
				total: this.getTotal(set, 'rare'),
			},
			{
				text: this.i18n.translateString('app.collection.set-stats.epics'),
				current: this.getOwned(set, 'epic'),
				total: this.getTotal(set, 'epic'),
			},
			{
				text: this.i18n.translateString('app.collection.set-stats.legendaries'),
				current: this.getOwned(set, 'legendary'),
				total: this.getTotal(set, 'legendary'),
			},
		];
	}

	private buildGoldenStats(set: Set): readonly Stat[] {
		const currentDust = set.allCards
			.map((card) => dustToCraftForPremium(card.rarity) * card.getNumberCollectedPremium())
			.reduce((a, b) => a + b, 0);
		const totalDust = set.allCards
			.map((card) => dustToCraftForPremium(card.rarity) * card.getMaxCollectible())
			.reduce((a, b) => a + b, 0);
		const duplicateDust = set.allCards
			.map((card) => dustForPremium(card.rarity) * Math.max(0, card.ownedPremium - card.getMaxCollectible()))
			.reduce((a, b) => a + b, 0);
		return [
			{
				text: this.i18n.translateString('app.collection.set-stats.golden-dust'),
				current: currentDust,
				total: totalDust,
				tooltip: this.i18n.translateString('app.collection.set-stats.golden-dust-tooltip', {
					value: (totalDust - currentDust).toLocaleString(),
				}),
			},
			{
				text: this.i18n.translateString('app.collection.set-stats.golden-duplicate-dust'),
				current: duplicateDust,
				total: undefined,
				tooltip: this.i18n.translateString('app.collection.set-stats.golden-duplicate-dust-tooltip', {
					value: duplicateDust.toLocaleString(),
				}),
			},
			{
				text: this.i18n.translateString('app.collection.set-stats.golden-commons'),
				current: this.getOwned(set, 'common', true),
				total: this.getTotal(set, 'common', true),
			},
			{
				text: this.i18n.translateString('app.collection.set-stats.golden-rares'),
				current: this.getOwned(set, 'rare', true),
				total: this.getTotal(set, 'rare', true),
			},
			{
				text: this.i18n.translateString('app.collection.set-stats.golden-epics'),
				current: this.getOwned(set, 'epic', true),
				total: this.getTotal(set, 'epic', true),
			},
			{
				text: this.i18n.translateString('app.collection.set-stats.golden-legendaries'),
				current: this.getOwned(set, 'legendary', true),
				total: this.getTotal(set, 'legendary', true),
			},
		];
	}

	private getOwned(set: Set, rarity: 'common' | 'rare' | 'epic' | 'legendary', golden = false): number {
		return set.allCards
			.filter((card) => card.rarity === rarity)
			.map((card) => (golden ? card.getNumberCollectedPremium() : card.getNumberCollected()))
			.reduce((a, b) => a + b, 0);
	}

	private getTotal(set: Set, rarity: 'common' | 'rare' | 'epic' | 'legendary', golden = false): number {
		return set.allCards
			.filter((card) => card.rarity === rarity)
			.map((card) => card.getMaxCollectible())
			.reduce((a, b) => a + b, 0);
	}
}

interface Stat {
	readonly text: string;
	readonly current: number;
	readonly total: number;
	readonly tooltip?: string;
}
