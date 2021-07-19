import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { BattlegroundsPersonalStatsHeroDetailsCategory } from '../../../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-stats-hero-details-category';
import { BgsHeroStatsFilterId } from '../../../../models/mainwindow/battlegrounds/categories/bgs-hero-stats-filter-id';
import { AppUiStoreService, cdLog, currentBgHeroId } from '../../../../services/app-ui-store.service';
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
			<bgs-player-capsule [player]="player$ | async" [displayTavernTier]="false">
				<bgs-hero-detailed-stats> </bgs-hero-detailed-stats>
			</bgs-player-capsule>
			<div class="stats" *ngIf="{ selectedTab: selectedTab$ | async } as obs">
				<ul class="tabs">
					<li
						*ngFor="let tab of tabs$ | async"
						class="tab"
						[ngClass]="{ 'active': tab === obs.selectedTab }"
						(mousedown)="selectTab(tab)"
					>
						{{ getLabel(tab) }}
					</li>
				</ul>
				<bgs-last-warbands class="stat" *ngxCacheIf="obs.selectedTab === 'final-warbands'"> </bgs-last-warbands>
				<bgs-mmr-evolution-for-hero class="stat" *ngxCacheIf="obs.selectedTab === 'mmr'">
				</bgs-mmr-evolution-for-hero>
				<bgs-warband-stats-for-hero class="stat" *ngxCacheIf="obs.selectedTab === 'warband-stats'">
				</bgs-warband-stats-for-hero>
				<bgs-winrate-stats-for-hero class="stat" *ngxCacheIf="obs.selectedTab === 'winrate-stats'">
				</bgs-winrate-stats-for-hero>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsPersonalStatsHeroDetailsComponent implements AfterViewInit {
	tabs$: Observable<readonly BgsHeroStatsFilterId[]>;
	selectedTab$: Observable<BgsHeroStatsFilterId>;
	player$: Observable<BgsPlayer>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly store: AppUiStoreService) {
		this.tabs$ = this.store
			.listen$(([main, nav]) => main.battlegrounds.findCategory(nav.navigationBattlegrounds.selectedCategoryId))
			.pipe(
				filter(
					([category]) => !!category && !!(category as BattlegroundsPersonalStatsHeroDetailsCategory).tabs,
				),
				map(([category]) => (category as BattlegroundsPersonalStatsHeroDetailsCategory).tabs),
				distinctUntilChanged(),
				tap((stat) => cdLog('emitting tabs in ', this.constructor.name, stat)),
			);
		this.selectedTab$ = this.store
			.listen$(([main, nav]) => nav.navigationBattlegrounds.selectedPersonalHeroStatsTab)
			.pipe(
				filter(([tab]) => !!tab),
				map(([tab]) => tab),
				distinctUntilChanged(),
				tap((stat) => cdLog('emitting selected tab in ', this.constructor.name, stat)),
			);
		this.player$ = this.store
			.listen$(
				([main, nav]) => main.battlegrounds.stats.heroStats,
				([main, nav]) => currentBgHeroId(main, nav),
			)
			.pipe(
				filter(([heroStats, heroId]) => !!heroStats && !!heroId),
				map(([heroStats, heroId]) => heroStats?.find((stat) => stat.id === heroId)),
				distinctUntilChanged(),
				map((heroStat) =>
					BgsPlayer.create({
						cardId: heroStat.id,
						displayedCardId: heroStat.id,
						heroPowerCardId: heroStat.heroPowerCardId,
					} as BgsPlayer),
				),
				tap((stat) => cdLog('emitting player in ', this.constructor.name, stat)),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
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
