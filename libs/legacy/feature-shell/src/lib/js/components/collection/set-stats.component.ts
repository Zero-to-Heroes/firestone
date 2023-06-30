import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { boosterIdToSetId } from '@firestone-hs/reference-data';
import { PackResult } from '@firestone-hs/user-packs';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { Preferences } from '../../models/preferences';
import { Set } from '../../models/set';
import {
	dustFor,
	dustForPremium,
	dustToCraftFor,
	dustToCraftForPremium,
	getPackDustValue,
} from '../../services/hs-utils';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';
import { InputPieChartData } from '../common/chart/input-pie-chart-data';

@Component({
	selector: 'set-stats',
	styleUrls: [
		`../../../css/global/forms.scss`,
		`../../../css/global/toggle.scss`,
		`../../../css/component/collection/set-stats.component.scss`,
	],
	template: `
		<div class="set-stats">
			<div class="top-container">
				<div
					class="title-container"
					[helpTooltip]="'app.collection.set-stats.click-to-show-history' | owTranslate"
					(click)="toggleStatsView()"
				>
					<div class="title" [owTranslate]="'app.collection.set-stats.title'"></div>
					<div class="caret" inlineSVG="assets/svg/caret.svg"></div>
				</div>
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
export class SetStatsComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	stats$: Observable<readonly Stat[]>;
	pieChartData$: Observable<readonly InputPieChartData[]>;
	packsReceived$: Observable<number>;
	bestKnownPackDust$: Observable<number>;
	bestKnownPack$: Observable<PackResult>;

	@Input() set sets(value: readonly Set[]) {
		if (value == null) {
			return;
		}
		this.sets$$.next(value);
	}

	sets$$ = new BehaviorSubject<readonly Set[]>([]);

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		const showGoldenStats$ = this.listenForBasicPref$((prefs) => prefs.collectionSetShowGoldenStats);
		this.stats$ = combineLatest([this.sets$$.asObservable(), showGoldenStats$]).pipe(
			this.mapData(([sets, showGoldenStats]) =>
				showGoldenStats ? this.buildGoldenStats(sets) : this.buildStats(sets),
			),
		);
		this.pieChartData$ = combineLatest([this.sets$$.asObservable(), showGoldenStats$]).pipe(
			this.mapData(([sets, showGoldenStats]) =>
				showGoldenStats ? this.buildGoldenPieChartData(sets) : this.buildPieChartData(sets),
			),
		);
		this.packsReceived$ = combineLatest([this.sets$$.asObservable(), this.store.packStats$()]).pipe(
			this.mapData(
				([sets, packs]) =>
					packs.filter((pack) => sets.some((s) => boosterIdToSetId(pack.boosterId) === s.id))?.length ?? 0,
			),
		);
		this.bestKnownPack$ = combineLatest([this.sets$$.asObservable(), this.store.packStats$()]).pipe(
			this.mapData(([sets, packStats]) => {
				const resultForSetId = packStats
					.filter((pack) => sets.some((s) => boosterIdToSetId(pack.boosterId) === s.id))
					.sort((a, b) => getPackDustValue(b) - getPackDustValue(a))[0];
				const resultForBoosterId = packStats
					.filter((pack) => sets.some((s) => boosterIdToSetId(pack.boosterId) === s.id))
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

	async toggleStatsView() {
		const prefs = await this.prefs.getPreferences();
		const newStatsView = prefs.collectionSetStatsTypeFilter === 'cards-stats' ? 'cards-history' : 'cards-stats';
		const newPrefs: Preferences = {
			...prefs,
			collectionSetStatsTypeFilter: newStatsView,
		};
		await this.prefs.savePreferences(newPrefs);
	}

	private buildPieChartData(sets: readonly Set[]): readonly InputPieChartData[] {
		return [
			{
				label: this.i18n.translateString('app.collection.set-stats.commons'),
				data: this.getOwned(sets, 'common'),
				color: 'rgba(217, 195, 171, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.commons-missing'),
				data: this.getTotal(sets, 'common') - this.getOwned(sets, 'common'),
				color: 'rgba(135, 121, 106, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.rares'),
				data: this.getOwned(sets, 'rare'),
				color: 'rgba(64, 78, 211, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.rares-missing'),
				data: this.getTotal(sets, 'rare') - this.getOwned(sets, 'rare'),
				color: 'rgba(40, 49, 130, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.epics'),
				data: this.getOwned(sets, 'epic'),
				color: 'rgba(162, 118, 175, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.epics-missing'),
				data: this.getTotal(sets, 'epic') - this.getOwned(sets, 'epic'),
				color: 'rgba(106, 78, 114, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.legendaries'),
				data: this.getOwned(sets, 'legendary'),
				color: 'rgba(233, 169, 67, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.legendaries-missing'),
				data: this.getTotal(sets, 'legendary') - this.getOwned(sets, 'legendary'),
				color: 'rgba(150, 107, 43, 1)',
			},
		];
	}

	private buildGoldenPieChartData(sets: readonly Set[]): readonly InputPieChartData[] {
		return [
			{
				label: this.i18n.translateString('app.collection.set-stats.golden-commons'),
				data: this.getOwned(sets, 'common', true),
				color: 'rgba(217, 195, 171, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.golden-commons-missing'),
				data: this.getTotal(sets, 'common', true) - this.getOwned(sets, 'common', true),
				color: 'rgba(135, 121, 106, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.golden-rares'),
				data: this.getOwned(sets, 'rare', true),
				color: 'rgba(64, 78, 211, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.golden-rares-missing'),
				data: this.getTotal(sets, 'rare', true) - this.getOwned(sets, 'rare', true),
				color: 'rgba(40, 49, 130, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.golden-epics'),
				data: this.getOwned(sets, 'epic', true),
				color: 'rgba(162, 118, 175, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.golden-epics-missing'),
				data: this.getTotal(sets, 'epic', true) - this.getOwned(sets, 'epic', true),
				color: 'rgba(106, 78, 114, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.golden-legendaries'),
				data: this.getOwned(sets, 'legendary', true),
				color: 'rgba(233, 169, 67, 1)',
			},
			{
				label: this.i18n.translateString('app.collection.set-stats.golden-legendaries-missing'),
				data: this.getTotal(sets, 'legendary', true) - this.getOwned(sets, 'legendary', true),
				color: 'rgba(150, 107, 43, 1)',
			},
		];
	}

	private buildStats(sets: readonly Set[]): readonly Stat[] {
		const currentDust = sets
			.flatMap((s) => s.allCards)
			.map((card) => dustToCraftFor(card.rarity) * card.getNumberCollected())
			.reduce((a, b) => a + b, 0);
		const totalDust = sets
			.flatMap((s) => s.allCards)
			.map((card) => dustToCraftFor(card.rarity) * card.getMaxCollectible())
			.reduce((a, b) => a + b, 0);
		const duplicateDust = sets
			.flatMap((s) => s.allCards)
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
				current: this.getOwned(sets, 'common'),
				total: this.getTotal(sets, 'common'),
			},
			{
				text: this.i18n.translateString('app.collection.set-stats.rares'),
				current: this.getOwned(sets, 'rare'),
				total: this.getTotal(sets, 'rare'),
			},
			{
				text: this.i18n.translateString('app.collection.set-stats.epics'),
				current: this.getOwned(sets, 'epic'),
				total: this.getTotal(sets, 'epic'),
			},
			{
				text: this.i18n.translateString('app.collection.set-stats.legendaries'),
				current: this.getOwned(sets, 'legendary'),
				total: this.getTotal(sets, 'legendary'),
			},
		];
	}

	private buildGoldenStats(sets: readonly Set[]): readonly Stat[] {
		const currentDust = sets
			.flatMap((s) => s.allCards)
			.map((card) => dustToCraftForPremium(card.rarity) * card.getNumberCollectedPremium())
			.reduce((a, b) => a + b, 0);
		const totalDust = sets
			.flatMap((s) => s.allCards)
			.map((card) => dustToCraftForPremium(card.rarity) * card.getMaxCollectible())
			.reduce((a, b) => a + b, 0);
		const duplicateDust = sets
			.flatMap((s) => s.allCards)
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
				current: this.getOwned(sets, 'common', true),
				total: this.getTotal(sets, 'common', true),
			},
			{
				text: this.i18n.translateString('app.collection.set-stats.golden-rares'),
				current: this.getOwned(sets, 'rare', true),
				total: this.getTotal(sets, 'rare', true),
			},
			{
				text: this.i18n.translateString('app.collection.set-stats.golden-epics'),
				current: this.getOwned(sets, 'epic', true),
				total: this.getTotal(sets, 'epic', true),
			},
			{
				text: this.i18n.translateString('app.collection.set-stats.golden-legendaries'),
				current: this.getOwned(sets, 'legendary', true),
				total: this.getTotal(sets, 'legendary', true),
			},
		];
	}

	private getOwned(sets: readonly Set[], rarity: 'common' | 'rare' | 'epic' | 'legendary', golden = false): number {
		return sets
			.flatMap((s) => s.allCards)
			.filter((card) => card.rarity === rarity)
			.map((card) => (golden ? card.getNumberCollectedPremium() : card.getNumberCollected()))
			.reduce((a, b) => a + b, 0);
	}

	private getTotal(sets: readonly Set[], rarity: 'common' | 'rare' | 'epic' | 'legendary', golden = false): number {
		return sets
			.flatMap((s) => s.allCards)
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
