import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { BgsHeroStat } from '../../../../models/battlegrounds/stats/bgs-hero-stat';
import { BattlegroundsPersonalStatsHeroDetailsCategory } from '../../../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-stats-hero-details-category';
import { BgsHeroStatsFilterId } from '../../../../models/mainwindow/battlegrounds/categories/bgs-hero-stats-filter-id';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationBattlegrounds } from '../../../../models/mainwindow/navigation/navigation-battlegrounds';
import { SelectBattlegroundsPersonalStatsHeroTabEvent } from '../../../../services/mainwindow/store/events/battlegrounds/select-battlegrounds-personal-stats-hero-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';

@Component({
	selector: 'battlegrounds-personal-stats-hero-details',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-personal-stats-hero-details.component.scss`,
		`../../../../../css/global/components-global.scss`,
	],
	template: `
		<div class="battlegrounds-personal-stats-hero-details">
			<bgs-player-capsule [player]="player" [displayTavernTier]="false">
				<bgs-hero-detailed-stats [state]="_state" [heroId]="_category?.heroId"> </bgs-hero-detailed-stats>
			</bgs-player-capsule>
			<div class="stats">
				<ul class="tabs">
					<li
						*ngFor="let tab of tabs"
						class="tab"
						[ngClass]="{ 'active': tab === selectedTab }"
						(mousedown)="selectTab(tab)"
					>
						{{ getLabel(tab) }}
					</li>
				</ul>
				<ng-container>
					<bgs-last-warbands
						class="stat"
						[state]="_state"
						[category]="_category"
						*ngxCacheIf="selectedTab === 'final-warbands'"
					>
					</bgs-last-warbands>
					<bgs-mmr-evolution-for-hero
						class="stat"
						*ngxCacheIf="selectedTab === 'mmr'"
						[category]="_category"
						[state]="_state.battlegrounds"
					>
					</bgs-mmr-evolution-for-hero>
					<bgs-warband-stats-for-hero
						class="stat"
						*ngxCacheIf="selectedTab === 'warband-stats'"
						[category]="_category"
						[state]="_state"
					>
					</bgs-warband-stats-for-hero>
					<bgs-winrate-stats-for-hero
						class="stat"
						*ngxCacheIf="selectedTab === 'winrate-stats'"
						[category]="_category"
						[state]="_state"
					>
					</bgs-winrate-stats-for-hero>
				</ng-container>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsPersonalStatsHeroDetailsComponent implements AfterViewInit {
	_category: BattlegroundsPersonalStatsHeroDetailsCategory;
	_state: MainWindowState;
	_navigation: NavigationBattlegrounds;

	player: BgsPlayer;
	heroStat: BgsHeroStat;
	tabs: readonly BgsHeroStatsFilterId[];
	selectedTab: BgsHeroStatsFilterId;

	@Input() set category(value: BattlegroundsPersonalStatsHeroDetailsCategory) {
		if (value === this._category) {
			return;
		}
		this._category = value;
		this.updateValues();
	}

	@Input() set state(value: MainWindowState) {
		if (value === this._state) {
			return;
		}
		this._state = value;
		this.updateValues();
	}

	@Input() set navigation(value: NavigationBattlegrounds) {
		if (value === this._navigation) {
			return;
		}
		this._navigation = value;
		this.updateValues();
	}

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}
	private updateValues() {
		if (!this._state || !this._category || !this._navigation) {
			// console.log('not updating value');
			return;
		}

		this.heroStat = this._state?.battlegrounds?.stats?.heroStats?.find((stat) => stat.id === this._category.heroId);
		if (!this.heroStat) {
			// console.log('not updating hero stat');
			return;
		}
		// console.log('setting stat', this._category.heroId, this.heroStat, this._state, this._category);
		this.player = BgsPlayer.create({
			cardId: this.heroStat.id,
			displayedCardId: this.heroStat.id,
			heroPowerCardId: this.heroStat.heroPowerCardId,
		} as BgsPlayer);
		this.tabs = this._category.tabs;
		this.selectedTab = this._navigation.selectedPersonalHeroStatsTab;
		// console.log('selectedTab', this.selectedTab, this._navigation);
	}

	getLabel(tab: BgsHeroStatsFilterId) {
		switch (tab) {
			case 'mmr':
				return 'MMR';
			case 'final-warbands':
				return 'Last warbands';
			case 'warband-stats':
				return 'Warband stats';
			case 'winrate-stats':
				return 'Combat winrate';
		}
	}

	selectTab(tab: BgsHeroStatsFilterId) {
		this.stateUpdater.next(new SelectBattlegroundsPersonalStatsHeroTabEvent(tab));
	}
}
