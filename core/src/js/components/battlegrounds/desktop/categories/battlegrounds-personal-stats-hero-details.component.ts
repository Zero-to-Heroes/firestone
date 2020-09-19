import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { Entity, EntityAsJS, EntityDefinition } from '@firestone-hs/replay-parser';
import { Map } from 'immutable';
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
			<bgs-player-capsule [player]="player" [displayTavernTier]="false"></bgs-player-capsule>
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
					<bgs-last-warbands class="stat" [state]="_state" [hidden]="selectedTab !== 'final-warbands'">
					</bgs-last-warbands>
					<bgs-mmr-evolution-for-hero
						class="stat"
						[hidden]="selectedTab !== 'mmr'"
						[category]="_category"
						[state]="_state.battlegrounds"
					>
					</bgs-mmr-evolution-for-hero>
					<!-- <bgs-chart-warband-stats
						class="stat"
						[hidden]="selectedTab !== 'warband-total-stats-by-turn'"
						[player]="_panel?.player"
						[globalStats]="_panel?.globalStats"
						[stats]="_panel?.stats"
						[visible]="selectedTab === 'warband-total-stats-by-turn'"
					>
					</bgs-chart-warband-stats>
					<bgs-chart-warband-composition
						class="stat"
						[hidden]="selectedTab !== 'warband-composition-by-turn'"
						[stats]="_panel?.stats"
						[visible]="selectedTab === 'warband-composition-by-turn'"
					>
					</bgs-chart-warband-composition> -->
				</ng-container>
			</div>
			<!-- <battlegrounds-stats-hero-vignette class="hero-stats" [stat]="heroStat"></battlegrounds-stats-hero-vignette> -->
			<!-- <div class="boards-container">
				<div class="boards" *ngIf="lastKnownBoards">
					<div class="header">Last known {{ lastKnownBoards.length }} boards</div>
					<bgs-board
						*ngFor="let board of lastKnownBoards"
						[entities]="board.entities"
						[customTitle]="board.title"
						[finalBoard]="true"
						[maxBoardHeight]="0.8"
						[debug]="true"
					></bgs-board>
				</div>
				<div class="empty-state" *ngIf="!lastKnownBoards">
					Loading last known boards
				</div>
			</div> -->
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

	lastKnownBoards: readonly KnownBoard[];

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
			return;
		}

		this.heroStat = this._state.battlegrounds.stats.heroStats.find(stat => stat.id === this._category.heroId);
		if (!this.heroStat) {
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
		console.log('selectedTab', this.selectedTab, this._navigation);

		this.lastKnownBoards = this._state.battlegrounds.lastHeroPostMatchStats
			? this._state.battlegrounds.lastHeroPostMatchStats
					.filter(postMatch => postMatch?.stats?.boardHistory && postMatch?.stats?.boardHistory.length > 0)
					.map(postMatch => {
						const bgsBoard = postMatch?.stats?.boardHistory[postMatch?.stats?.boardHistory.length - 1];
						const boardEntities = bgsBoard.board.map(boardEntity =>
							boardEntity instanceof Entity || boardEntity.tags instanceof Map
								? Entity.create(new Entity(), boardEntity as EntityDefinition)
								: Entity.fromJS((boardEntity as unknown) as EntityAsJS),
						) as readonly Entity[];
						const review = this._state.stats.gameStats.stats.find(
							matchStat => matchStat.reviewId === postMatch.reviewId,
						);
						const title =
							review && review.additionalResult
								? `You finished ${this.getFinishPlace(parseInt(review.additionalResult))} place`
								: `Last board`;
						return {
							entities: boardEntities,
							title: title,
						} as KnownBoard;
					})
			: null;
		// console.log('lastKnownBoards', this.lastKnownBoards);
	}

	getLabel(tab: BgsHeroStatsFilterId) {
		switch (tab) {
			case 'mmr':
				return 'MMR';
			case 'final-warbands':
				return 'Last warbands';
			case 'warband-stats':
				return 'Warband stats';
		}
	}

	selectTab(tab: BgsHeroStatsFilterId) {
		this.stateUpdater.next(new SelectBattlegroundsPersonalStatsHeroTabEvent(tab));
	}

	private getFinishPlace(finalPlace: number): string {
		switch (finalPlace) {
			case 1:
				return '1st';
			case 2:
				return '2nd';
			case 3:
				return '3rd';
			default:
				return finalPlace + 'th';
		}
	}
}

interface KnownBoard {
	readonly entities: readonly Entity[];
	readonly title: string;
}
