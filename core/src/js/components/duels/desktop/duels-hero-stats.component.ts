import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { DuelsHeroPlayerStat } from '../../../models/duels/duels-player-stats';
import { DuelsState } from '../../../models/duels/duels-state';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'duels-hero-stats',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/duels/desktop/duels-hero-stats.component.scss`,
	],
	template: `
		<div class="duels-hero-stats" scrollable>
			<duels-hero-stat-vignette *ngFor="let stat of stats" [stat]="stat"></duels-hero-stat-vignette>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsHeroStatsComponent implements AfterViewInit {
	@Input() set state(value: DuelsState) {
		if (value === this._state) {
			return;
		}
		this._state = value;
		this.updateValues();
	}

	_state: DuelsState;
	stats: readonly DuelsHeroPlayerStat[];

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	private updateValues() {
		if (!this._state?.playerStats) {
			return;
		}
		// TODO: add a way to choose whether to see heroes / hero powers / signature treasures (use same
		// page, probably no need for several tabs)
		this.stats = this._state.playerStats.heroStats;
	}
}
