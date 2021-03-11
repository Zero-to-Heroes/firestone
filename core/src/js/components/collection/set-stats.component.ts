import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { Set } from '../../models/set';
import { dustFor, dustForPremium } from '../../services/hs-utils';
import { CollectionSetShowGoldenStatsEvent } from '../../services/mainwindow/store/events/collection/collection-set-show-golden-stats-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';

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
						[toggleFunction]="toggleShowGolden"
					></preference-toggle>
				</section>
			</div>
			<div class="stats">
				<set-stat-cell
					*ngFor="let stat of stats"
					[text]="stat.text"
					[current]="stat.current"
					[total]="stat.total"
				></set-stat-cell>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetStatsComponent implements AfterViewInit {
	@Input() set set(value: Set) {
		this._set = value;
		this.updateInfos();
	}

	@Input() set showGoldenStats(value: boolean) {
		this._showGoldenStats = value;
		this.updateInfos();
	}

	_set: Set;
	_showGoldenStats: boolean;
	stats: readonly Stat[];

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	toggleShowGolden = (newValue: boolean) => {
		this.stateUpdater.next(new CollectionSetShowGoldenStatsEvent(newValue));
	};

	private updateInfos() {
		if (!this._set) {
			return;
		}

		this.stats = this._showGoldenStats ? this.buildGoldenStats() : this.buildStats();
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
