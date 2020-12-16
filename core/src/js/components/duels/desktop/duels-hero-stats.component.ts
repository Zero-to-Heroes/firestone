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
		<div *ngIf="stats?.length" class="duels-hero-stats" scrollable>
			<duels-hero-stat-vignette *ngFor="let stat of stats" [stat]="stat"></duels-hero-stat-vignette>
		</div>
		<duels-empty-state *ngIf="!stats?.length"></duels-empty-state>
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
		switch (this._state.activeStatTypeFilter) {
			case 'hero-power':
				this.stats = this._state.playerStats.heroPowerStats;
				break;
			case 'signature-treasure':
				this.stats = this._state.playerStats.signatureTreasureStats;
				break;
			case 'hero':
			default:
				this.stats = this._state.playerStats.heroStats;
				break;
		}
	}
}
