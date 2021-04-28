import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { DuelsTreasureStat } from '../../../../models/duels/duels-player-stats';
import { DuelsState } from '../../../../models/duels/duels-state';
import { duelsTreasureRank, isPassive } from '../../../../services/duels/duels-utils';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { DuelsTier, DuelsTierItem } from './duels-tier';

@Component({
	selector: 'duels-treasure-tier-list',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/component/duels/desktop/secondary/duels-treasure-tier-list.component.scss`,
	],
	template: `
		<div class="duels-treasure-tier-list">
			<div class="title" helpTooltip="The tiers are computed for your current filters">
				Tier List
			</div>
			<duels-tier class="duels-tier" *ngFor="let tier of tiers" [tier]="tier"></duels-tier>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsTreasureTierListComponent implements AfterViewInit {
	_state: DuelsState;
	tiers: DuelsTier[] = [];

	@Input() set state(value: DuelsState) {
		if (value === this._state) {
			return;
		}
		this._state = value;
		this.updateValues();
	}

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly allCards: AllCardsService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	private updateValues() {
		if (!this._state) {
			return;
		}
		const stats = this.buildStats();

		this.tiers = [
			{
				label: 'S',
				tooltip: 'Must pick',
				items: this.filterItems(stats, 60, 101),
			},
			{
				label: 'A',
				tooltip: 'Strong pick',
				items: this.filterItems(stats, 57, 60),
			},
			{
				label: 'B',
				tooltip: 'Good pick',
				items: this.filterItems(stats, 54, 57),
			},
			{
				label: 'C',
				tooltip: 'Fair pick',
				items: this.filterItems(stats, 50, 54),
			},
			{
				label: 'D',
				tooltip: 'Preferably avoid',
				items: this.filterItems(stats, 45, 50),
			},
			{
				label: 'E',
				tooltip: 'Defnitely avoid',
				items: this.filterItems(stats, 0, 45),
			},
		].filter(tier => tier.items?.length);
	}

	private filterItems(
		stats: readonly DuelsTreasureStat[],
		threshold: number,
		upper: number,
	): readonly DuelsTierItem[] {
		return stats
			.filter(stat => stat.globalWinrate)
			.filter(stat => stat.globalWinrate >= threshold && stat.globalWinrate < upper)
			.map(stat => ({
				cardId: stat.cardId,
				icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${stat.cardId}.jpg`,
			}));
	}

	private buildStats(): readonly DuelsTreasureStat[] {
		switch (this._state.activeTreasureStatTypeFilter) {
			case 'treasure-1':
				return this._state.playerStats.treasureStats.filter(
					stat => !isPassive(stat.cardId, this.allCards) && duelsTreasureRank(stat.cardId) === 1,
				);
			case 'treasure-2':
				return this._state.playerStats.treasureStats.filter(
					stat => !isPassive(stat.cardId, this.allCards) && duelsTreasureRank(stat.cardId) >= 2,
				);
			case 'treasure-3':
				return this._state.playerStats.treasureStats.filter(
					stat => !isPassive(stat.cardId, this.allCards) && duelsTreasureRank(stat.cardId) === 3,
				);
			case 'passive-1':
				return this._state.playerStats.treasureStats.filter(
					stat => isPassive(stat.cardId, this.allCards) && duelsTreasureRank(stat.cardId) === 1,
				);
			case 'passive-2':
				return this._state.playerStats.treasureStats.filter(
					stat => isPassive(stat.cardId, this.allCards) && duelsTreasureRank(stat.cardId) >= 2,
				);
			case 'passive-3':
				return this._state.playerStats.treasureStats.filter(
					stat => isPassive(stat.cardId, this.allCards) && duelsTreasureRank(stat.cardId) === 3,
				);
			default:
				return [];
		}
	}
}
