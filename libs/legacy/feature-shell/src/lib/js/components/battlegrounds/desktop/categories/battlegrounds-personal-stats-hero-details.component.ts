import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	ViewRef,
} from '@angular/core';
import { GameType, defaultStartingHp } from '@firestone-hs/reference-data';
import { BgsPlayer, BgsPlayerHeroStatsService } from '@firestone/battlegrounds/common';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { BgsHeroStatsFilterId } from '../../../../models/mainwindow/battlegrounds/categories/bgs-hero-stats-filter-id';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { SelectBattlegroundsPersonalStatsHeroTabEvent } from '../../../../services/mainwindow/store/events/battlegrounds/select-battlegrounds-personal-stats-hero-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { currentBgHeroId } from '../../../../services/ui-store/app-ui-store.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'battlegrounds-personal-stats-hero-details',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-personal-stats-hero-details.component.scss`,
	],
	template: `
		<with-loading [isLoading]="(player$ | async) == null">
			<div class="battlegrounds-personal-stats-hero-details">
				<bgs-player-capsule [player]="player$ | async" [displayTavernTier]="false">
					<bgs-hero-detailed-stats> </bgs-hero-detailed-stats>
				</bgs-player-capsule>
				<div class="stats" *ngIf="selectedTab$ | async as selectedTab">
					<ul class="tabs">
						<li
							*ngFor="let tab of tabs"
							class="tab"
							[ngClass]="{ active: tab === selectedTab }"
							(mousedown)="selectTab(tab)"
						>
							{{ getLabel(tab) }}
						</li>
					</ul>
					<bgs-strategies class="stat" *ngIf="selectedTab === 'strategies'"> </bgs-strategies>
					<bgs-last-warbands class="stat" *ngIf="selectedTab === 'final-warbands'"> </bgs-last-warbands>
					<bgs-mmr-evolution-for-hero class="stat" *ngIf="selectedTab === 'mmr'">
					</bgs-mmr-evolution-for-hero>
					<bgs-warband-stats-for-hero class="stat" *ngIf="selectedTab === 'warband-stats'">
					</bgs-warband-stats-for-hero>
					<bgs-winrate-stats-for-hero class="stat" *ngIf="selectedTab === 'winrate-stats'">
					</bgs-winrate-stats-for-hero>
				</div>
			</div>
		</with-loading>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsPersonalStatsHeroDetailsComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	tabs: readonly BgsHeroStatsFilterId[] = [
		'strategies',
		'winrate-stats',
		// Graph is buggy at the moment, and is not super useful, so let's scrap it for now
		// 'mmr',
		'warband-stats',
		'final-warbands',
	];
	selectedTab$: Observable<BgsHeroStatsFilterId>;
	player$: Observable<BgsPlayer>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly heroStats: BgsPlayerHeroStatsService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await Promise.all([this.heroStats.isReady()]);

		this.selectedTab$ = this.store
			.listen$(([main, nav]) => nav.navigationBattlegrounds.selectedPersonalHeroStatsTab)
			.pipe(
				filter(([tab]) => !!tab),
				this.mapData(([tab]) => tab),
			);
		this.player$ = combineLatest([
			this.heroStats.tiersWithPlayerData$$,
			this.store.listen$(
				([main, nav]) => main.battlegrounds,
				([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId,
			),
		]).pipe(
			map(([heroStats, [battlegrounds, selectedCategoryId]]) => ({
				heroStats: heroStats,
				heroId: currentBgHeroId(battlegrounds, selectedCategoryId),
			})),
			filter((info) => !!info.heroId),
			map((info) => info.heroStats?.find((stat) => stat.id === info.heroId)),
			distinctUntilChanged(),
			this.mapData((heroStat) =>
				heroStat == null
					? null
					: BgsPlayer.create({
							cardId: heroStat.id,
							displayedCardId: heroStat.id,
							heroPowerCardId: heroStat.heroPowerCardId,
							initialHealth: defaultStartingHp(GameType.GT_BATTLEGROUNDS, heroStat.id, this.allCards),
					  } as BgsPlayer),
			),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	getLabel(tab: BgsHeroStatsFilterId) {
		return this.i18n.translateString(`app.battlegrounds.personal-stats.hero-details.tabs.${tab}`);
	}

	selectTab(tab: BgsHeroStatsFilterId) {
		this.stateUpdater.next(new SelectBattlegroundsPersonalStatsHeroTabEvent(tab));
	}
}
