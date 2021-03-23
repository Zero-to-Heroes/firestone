import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { PackResult } from '@firestone-hs/retrieve-pack-stats';
import { PackInfo } from '../../models/collection/pack-info';
import { BinderState } from '../../models/mainwindow/binder-state';
import { Preferences } from '../../models/preferences';
import { Set } from '../../models/set';
import { FeatureFlags } from '../../services/feature-flags';
import { boosterIdToSetId, dustFor, dustForPremium, getPackDustValue } from '../../services/hs-utils';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';
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
				<div class="title">Set stats</div>
				<section class="toggle-label">
					<preference-toggle
						field="collectionSetShowGoldenStats"
						label="Show stats for golden"
					></preference-toggle>
				</section>
			</div>
			<div class="stats" scrollable>
				<set-stat-cell
					*ngFor="let stat of stats"
					[text]="stat.text"
					[current]="stat.current"
					[total]="stat.total"
				></set-stat-cell>
				<pie-chart [data]="pieChartData"></pie-chart>
				<set-stat-cell
					*ngIf="packsReceived"
					[text]="'Packs received'"
					[current]="packsReceived"
					helpTooltip="All-time packs received, including the ones that are still unopened."
				></set-stat-cell>
				<div class="set-stat-cell">
					<div class="text">Best known pack</div>
					<div class="value">
						<div class="item">
							<div class="dust">{{ bestKnownPackDust }}</div>
							<div class="icon" inlineSVG="assets/svg/rewards/reward_dust.svg"></div>
						</div>
					</div>
				</div>
				<pack-display [pack]="bestKnownPack" *ngIf="bestKnownPack"></pack-display>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetStatsComponent implements AfterViewInit {
	enableBestKnownPack = FeatureFlags.ENABLE_BEST_KNOWN_PACK;

	@Input() set set(value: Set) {
		this._set = value;
		this.updateInfos();
	}

	@Input() set prefs(value: Preferences) {
		this._showGoldenStats = value?.collectionSetShowGoldenStats;
		this.updateInfos();
	}

	@Input() set state(value: BinderState) {
		if (value.packs === this._packs && value.packStats === this._packStats) {
			return;
		}
		this._packs = value?.packs ?? [];
		this._packStats = value?.packStats ?? [];
		this.updateInfos();
	}

	_set: Set;
	_showGoldenStats: boolean;
	_packs: readonly PackInfo[] = [];
	_packStats: readonly PackResult[] = [];
	stats: readonly Stat[];
	pieChartData: readonly InputPieChartData[];
	packsReceived: number;
	bestKnownPackDust: number;
	bestKnownPack: PackResult;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	private updateInfos() {
		if (!this._set) {
			return;
		}

		this.stats = this._showGoldenStats ? this.buildGoldenStats() : this.buildStats();
		this.pieChartData = this._showGoldenStats ? this.buildGoldenPieChartData() : this.buildPieChartData();
		this.packsReceived =
			this._packs.find(pack => boosterIdToSetId(pack.packType) === this._set.id)?.totalObtained ?? 0;
		const orderedPacks = [...this._packStats]
			.filter(pack => pack.setId === this._set.id)
			.sort((a, b) => getPackDustValue(b) - getPackDustValue(a));
		this.bestKnownPack = orderedPacks.length ? orderedPacks[0] : null;
		this.bestKnownPackDust = this.bestKnownPack ? getPackDustValue(this.bestKnownPack) : 0;
		// console.debug('best known pack', this.bestKnownPack, this.bestKnownPackDust);
	}

	private buildPieChartData(): readonly InputPieChartData[] {
		return [
			{
				label: 'Commons',
				data: this.getOwned('common'),
				color: 'rgba(217, 195, 171, 1)',
			},
			{
				label: 'Missing Commons',
				data: this.getTotal('common') - this.getOwned('common'),
				color: 'rgba(135, 121, 106, 1)',
			},
			{
				label: 'Rares',
				data: this.getOwned('rare'),
				color: 'rgba(64, 78, 211, 1)',
			},
			{
				label: 'Missing Rares',
				data: this.getTotal('rare') - this.getOwned('rare'),
				color: 'rgba(40, 49, 130, 1)',
			},
			{
				label: 'Epics',
				data: this.getOwned('epic'),
				color: 'rgba(162, 118, 175, 1)',
			},
			{
				label: 'Missing Epics',
				data: this.getTotal('epic') - this.getOwned('epic'),
				color: 'rgba(106, 78, 114, 1)',
			},
			{
				label: 'Legendaries',
				data: this.getOwned('legendary'),
				color: 'rgba(233, 169, 67, 1)',
			},
			{
				label: 'Missing Legendaries',
				data: this.getTotal('legendary') - this.getOwned('legendary'),
				color: 'rgba(150, 107, 43, 1)',
			},
		];
	}

	private buildGoldenPieChartData(): readonly InputPieChartData[] {
		return [
			{
				label: 'Golden Commons',
				data: this.getOwned('common', true),
				color: 'rgba(217, 195, 171, 1)',
			},
			{
				label: 'Missing Golden Commons',
				data: this.getTotal('common', true) - this.getOwned('common', true),
				color: 'rgba(135, 121, 106, 1)',
			},
			{
				label: 'Golden Rares',
				data: this.getOwned('rare', true),
				color: 'rgba(64, 78, 211, 1)',
			},
			{
				label: 'Missing Golden Rares',
				data: this.getTotal('rare', true) - this.getOwned('rare', true),
				color: 'rgba(40, 49, 130, 1)',
			},
			{
				label: 'Golden Epics',
				data: this.getOwned('epic', true),
				color: 'rgba(162, 118, 175, 1)',
			},
			{
				label: 'Missing Golden Epics',
				data: this.getTotal('epic', true) - this.getOwned('epic', true),
				color: 'rgba(106, 78, 114, 1)',
			},
			{
				label: 'Golden Legendaries',
				data: this.getOwned('legendary', true),
				color: 'rgba(233, 169, 67, 1)',
			},
			{
				label: 'Missing Golden Legendaries',
				data: this.getTotal('legendary', true) - this.getOwned('legendary', true),
				color: 'rgba(150, 107, 43, 1)',
			},
		];
	}

	private buildStats(): readonly Stat[] {
		return [
			{
				text: 'Dust',
				current: this._set.allCards
					.map(card => dustFor(card.rarity) * card.getNumberCollected())
					.reduce((a, b) => a + b, 0),
				total: this._set.allCards
					.map(card => dustFor(card.rarity) * card.getMaxCollectible())
					.reduce((a, b) => a + b, 0),
			},
			{
				text: 'Common',
				current: this.getOwned('common'),
				total: this.getTotal('common'),
			},
			{
				text: 'Rare',
				current: this.getOwned('rare'),
				total: this.getTotal('rare'),
			},
			{
				text: 'Epic',
				current: this.getOwned('epic'),
				total: this.getTotal('epic'),
			},
			{
				text: 'Legendary',
				current: this.getOwned('legendary'),
				total: this.getTotal('legendary'),
			},
		];
	}

	private buildGoldenStats(): readonly Stat[] {
		return [
			{
				text: 'Golden Dust',
				current: this._set.allCards
					.map(card => dustForPremium(card.rarity) * card.getNumberCollectedPremium())
					.reduce((a, b) => a + b, 0),
				total: this._set.allCards
					.map(card => dustForPremium(card.rarity) * card.getMaxCollectible())
					.reduce((a, b) => a + b, 0),
			},
			{
				text: 'Golden Common',
				current: this.getOwned('common', true),
				total: this.getTotal('common', true),
			},
			{
				text: 'Golden Rare',
				current: this.getOwned('rare', true),
				total: this.getTotal('rare', true),
			},
			{
				text: 'Golden Epic',
				current: this.getOwned('epic', true),
				total: this.getTotal('epic', true),
			},
			{
				text: 'Golden Legendary',
				current: this.getOwned('legendary', true),
				total: this.getTotal('legendary', true),
			},
		];
	}

	private getOwned(rarity: 'common' | 'rare' | 'epic' | 'legendary', golden = false): number {
		return this._set.allCards
			.filter(card => card.rarity === rarity)
			.map(card => (golden ? card.getNumberCollectedPremium() : card.getNumberCollected()))
			.reduce((a, b) => a + b, 0);
	}

	private getTotal(rarity: 'common' | 'rare' | 'epic' | 'legendary', golden = false): number {
		return this._set.allCards
			.filter(card => card.rarity === rarity)
			.map(card => card.getMaxCollectible())
			.reduce((a, b) => a + b, 0);
	}
}

interface Stat {
	readonly text: string;
	readonly current: number;
	readonly total: number;
}
