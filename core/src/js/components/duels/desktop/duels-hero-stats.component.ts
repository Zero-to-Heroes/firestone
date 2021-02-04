import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
} from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { DuelsHeroPlayerStat } from '../../../models/duels/duels-player-stats';
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
				*ngFor="let stat of stats; trackBy: trackByFn"
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

	stats: readonly DuelsHeroPlayerStatContainer[];

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;
	// private previewHeroStats: readonly DuelsHeroPlayerStat[];

	constructor(
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private readonly allCards: AllCardsService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	trackByFn(stat: DuelsHeroPlayerStatContainer) {
		return stat?.stat?.cardId;
	}

	private async updateValues() {
		if (!this._state?.playerStats) {
			return;
		}
		// const prefs = await this.prefs.getPreferences();
		let stats;
		switch (this._state.activeStatTypeFilter) {
			case 'hero-power':
				stats = this._state.playerStats.heroPowerStats;
				break;
			case 'signature-treasure':
				stats = this._state.playerStats.signatureTreasureStats;
				break;
			case 'hero':
			default:
				stats = this._state.playerStats.heroStats;
				break;
		}

		this.stats = this._navigation?.heroSearchString
			? stats.map(
					stat =>
						({
							stat: stat,
							visible: this.allCards
								.getCard(stat.cardId)
								?.name?.toLowerCase()
								?.includes(this._navigation.heroSearchString.toLowerCase()),
						} as DuelsHeroPlayerStatContainer),
			  )
			: stats.map(stat => ({
					stat: stat,
					visible: true,
			  }));
	}
}

interface DuelsHeroPlayerStatContainer {
	readonly stat: DuelsHeroPlayerStat;
	readonly visible: boolean;
}
