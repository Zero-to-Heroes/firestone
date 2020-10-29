import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { DuelsTreasureStat } from '../../../models/duels/duels-player-stats';
import { DuelsState } from '../../../models/duels/duels-state';
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
		<div class="duels-treasure-stats" scrollable>
			<duels-treasure-stat-vignette *ngFor="let stat of stats" [stat]="stat"></duels-treasure-stat-vignette>
		</div>
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

	_state: DuelsState;
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
		switch (this._state.activeTreasureStatTypeFilter) {
			case 'treasure':
				this.stats = this._state.playerStats.treasureStats.filter(
					stat => !isPassive(stat.cardId, this.allCards),
				);
				break;
			case 'passive':
				this.stats = this._state.playerStats.treasureStats.filter(stat =>
					isPassive(stat.cardId, this.allCards),
				);
				break;
		}
	}
}
