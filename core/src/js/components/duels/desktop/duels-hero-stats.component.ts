import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
} from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { isEqual } from 'lodash-es';
import { DuelsHeroPlayerStat, DuelsPlayerStats } from '../../../models/duels/duels-player-stats';
import { DuelsStatTypeFilterType } from '../../../models/duels/duels-stat-type-filter.type';
import { DuelsState } from '../../../models/duels/duels-state';
import { NavigationDuels } from '../../../models/mainwindow/navigation/navigation-duels';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';

@Component({
	selector: 'duels-hero-stats',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/duels/desktop/duels-hero-stats.component.scss`,
	],
	template: `
		<div *ngIf="stats?.length" class="duels-hero-stats" scrollable>
			<duels-hero-stat-vignette
				*ngFor="let stat of stats"
				[stat]="stat.stat"
				[ngClass]="{ 'hidden': !stat.visible }"
			></duels-hero-stat-vignette>
		</div>
		<duels-empty-state *ngIf="!stats?.length"></duels-empty-state>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsHeroStatsComponent implements AfterViewInit {
	@Input() set state(value: DuelsState) {
		const stats = value?.playerStats;
		if (stats === this._playerStats) {
			return;
		}
		this._playerStats = stats;
		this.updateValues();
	}

	@Input() set navigation(value: NavigationDuels) {
		const searchString = value?.heroSearchString;
		if (searchString === this._searchString) {
			return;
		}
		this._searchString = searchString;
		this.updateValues(true);
	}

	@Input() set statType(value: DuelsStatTypeFilterType) {
		if (value === this._statType) {
			return;
		}
		this._statType = value;
		this.updateValues();
	}

	stats: readonly DuelsHeroPlayerStatContainer[];

	private _playerStats: DuelsPlayerStats;
	private _searchString: string;
	private _statType: DuelsStatTypeFilterType;

	private displayedStats: readonly DuelsHeroPlayerStat[];
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private readonly allCards: AllCardsService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	// trackByFn(stat: DuelsHeroPlayerStatContainer) {
	// 	return stat?.stat?.cardId;
	// }

	private async updateValues(searchStringUpdated = false) {
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
			? this.displayedStats.map(
					stat =>
						({
							stat: stat,
							visible: this.allCards
								.getCard(stat.cardId)
								?.name?.toLowerCase()
								?.includes(this._searchString.toLowerCase()),
						} as DuelsHeroPlayerStatContainer),
			  )
			: this.displayedStats.map(stat => ({
					stat: stat,
					visible: true,
			  }));
	}

	private getStats() {
		switch (this._statType) {
			case 'hero-power':
				return this._playerStats.heroPowerStats;
			case 'signature-treasure':
				return this._playerStats.signatureTreasureStats;
			case 'hero':
			default:
				return this._playerStats.heroStats;
		}
	}
}

interface DuelsHeroPlayerStatContainer {
	readonly stat: DuelsHeroPlayerStat;
	readonly visible: boolean;
}
