import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { DuelsHeroPlayerStat } from '../../../models/duels/duels-player-stats';
import { DuelsState } from '../../../models/duels/duels-state';
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

	constructor(
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private cdr: ChangeDetectorRef,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	private async updateValues() {
		if (!this._state?.playerStats) {
			return;
		}
		const prefs = await this.prefs.getPreferences();
		const classFilter = prefs.duelsActiveTopDecksClassFilter;
		switch (this._state.activeStatTypeFilter) {
			case 'hero-power':
				this.stats = this._state.playerStats.heroPowerStats.filter(
					stat =>
						!classFilter ||
						classFilter === 'all' ||
						stat.heroClass?.toLowerCase() === prefs.duelsActiveTopDecksClassFilter,
				);
				break;
			case 'signature-treasure':
				this.stats = this._state.playerStats.signatureTreasureStats.filter(
					stat =>
						!classFilter ||
						classFilter === 'all' ||
						stat.heroClass?.toLowerCase() === prefs.duelsActiveTopDecksClassFilter,
				);
				break;
			case 'hero':
			default:
				this.stats = this._state.playerStats.heroStats.filter(
					stat =>
						!classFilter ||
						classFilter === 'all' ||
						stat.heroClass?.toLowerCase() === prefs.duelsActiveTopDecksClassFilter,
				);
				break;
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
