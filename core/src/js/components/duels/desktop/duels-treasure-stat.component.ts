import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { DuelsTreasureStat } from '../../../models/duels/duels-player-stats';
import { DuelsState } from '../../../models/duels/duels-state';
import { NavigationDuels } from '../../../models/mainwindow/navigation/navigation-duels';
import { isPassive } from '../../../services/duels/duels-utils';
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
			<duels-treasure-stat-vignette *ngFor="let stat of stats" [stat]="stat"></duels-treasure-stat-vignette>
		</div>
		<duels-empty-state *ngIf="!stats?.length"></duels-empty-state>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsTreasureStatsComponent implements AfterViewInit {
	@Input() set state(value: DuelsState) {
		if (value === this._state) {
			return;
		}
		this._state = value;
		this.updateValues();
	}

	@Input() set navigation(value: NavigationDuels) {
		if (value === this._navigation) {
			return;
		}
		this._navigation = value;
		this.updateValues();
	}

	_state: DuelsState;
	_navigation: NavigationDuels;
	stats: readonly DuelsTreasureStat[];

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

		this.stats = this._navigation?.treasureSearchString
			? stats.filter(stat =>
					this.allCards
						.getCard(stat.cardId)
						?.name?.toLowerCase()
						?.includes(this._navigation.treasureSearchString.toLowerCase()),
			  )
			: stats;
		console.debug('stats', this.stats);
	}

	private buildStats(): readonly DuelsTreasureStat[] {
		switch (this._state.activeTreasureStatTypeFilter) {
			case 'treasure':
				return this._state.playerStats.treasureStats.filter(stat => !isPassive(stat.cardId, this.allCards));
			case 'passive':
				return this._state.playerStats.treasureStats.filter(stat => isPassive(stat.cardId, this.allCards));
		}
	}
}
