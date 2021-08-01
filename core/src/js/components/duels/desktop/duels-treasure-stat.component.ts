import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { isEqual } from 'lodash';
import { DuelsPlayerStats, DuelsTreasureStat } from '../../../models/duels/duels-player-stats';
import { DuelsState } from '../../../models/duels/duels-state';
import { DuelsTreasureStatTypeFilterType } from '../../../models/duels/duels-treasure-stat-type-filter.type';
import { NavigationDuels } from '../../../models/mainwindow/navigation/navigation-duels';
import { duelsTreasureRank, isPassive } from '../../../services/duels/duels-utils';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'duels-treasure-stats',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/duels/desktop/duels-treasure-stats.component.scss`,
	],
	template: `
		<div *ngIf="stats?.length" class="duels-treasure-stats" scrollable>
			<duels-treasure-stat-vignette
				*ngFor="let stat of stats; trackBy: trackByFn"
				[stat]="stat.stat"
				[ngClass]="{ 'hidden': !stat.visible }"
			></duels-treasure-stat-vignette>
		</div>
		<duels-empty-state *ngIf="!stats?.length"></duels-empty-state>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsTreasureStatsComponent implements AfterViewInit {
	@Input() set state(value: DuelsState) {
		const stats = value?.playerStats;
		if (stats === this._playerStats) {
			return;
		}
		this._playerStats = stats;
		this.updateValues();
	}

	@Input() set navigation(value: NavigationDuels) {
		const searchString = value?.treasureSearchString;
		// console.debug('update search string', searchString);
		if (searchString === this._searchString) {
			return;
		}
		this._searchString = searchString;
		this.updateValues(true);
	}

	@Input() set statType(value: DuelsTreasureStatTypeFilterType) {
		if (value === this._statType) {
			return;
		}
		this._statType = value;
		this.updateValues();
	}

	stats: readonly DuelsTreasureStatContainer[];

	private _playerStats: DuelsPlayerStats;
	private _searchString: string;
	private _statType: DuelsTreasureStatTypeFilterType;

	private displayedStats: readonly DuelsTreasureStat[];
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly allCards: CardsFacadeService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	trackByFn(stat: DuelsTreasureStatContainer) {
		return stat?.stat?.cardId;
	}

	private updateValues(searchStringUpdated = false) {
		if (!this._playerStats || !this._statType) {
			return;
		}

		// Usually we don't really mind, but here there are a lot of graphs to be rendered every time,
		// so we only want to refresh the data if it really has changed
		const newStats = this.getStats();
		if (!searchStringUpdated && isEqual(newStats, this.displayedStats)) {
			return;
		}

		this.displayedStats = newStats;
		this.stats = this._searchString
			? this.displayedStats.map((stat) => ({
					stat: stat,
					visible: this.allCards
						.getCard(stat.cardId)
						?.name?.toLowerCase()
						?.includes(this._searchString.toLowerCase()),
			  }))
			: this.displayedStats.map((stat) => ({
					stat: stat,
					visible: true,
			  }));
	}

	private getStats(): readonly DuelsTreasureStat[] {
		switch (this._statType) {
			case 'treasure-1':
				return this._playerStats.treasureStats.filter(
					(stat) => !isPassive(stat.cardId, this.allCards) && duelsTreasureRank(stat.cardId) === 1,
				);
			case 'treasure-2':
				return this._playerStats.treasureStats.filter(
					(stat) => !isPassive(stat.cardId, this.allCards) && duelsTreasureRank(stat.cardId) >= 2,
				);
			case 'treasure-3':
				return this._playerStats.treasureStats.filter(
					(stat) => !isPassive(stat.cardId, this.allCards) && duelsTreasureRank(stat.cardId) === 3,
				);
			case 'passive-1':
				return this._playerStats.treasureStats.filter(
					(stat) => isPassive(stat.cardId, this.allCards) && duelsTreasureRank(stat.cardId) === 1,
				);
			case 'passive-2':
				return this._playerStats.treasureStats.filter(
					(stat) => isPassive(stat.cardId, this.allCards) && duelsTreasureRank(stat.cardId) >= 2,
				);
			case 'passive-3':
				return this._playerStats.treasureStats.filter(
					(stat) => isPassive(stat.cardId, this.allCards) && duelsTreasureRank(stat.cardId) === 3,
				);
		}
	}
}

interface DuelsTreasureStatContainer {
	readonly stat: DuelsTreasureStat;
	readonly visible: boolean;
}
