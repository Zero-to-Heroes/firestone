import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { GameType, defaultStartingHp } from '@firestone-hs/reference-data';
import {
	BattlegroundsNavigationService,
	BgsHeroStatsFilterId,
	BgsPlayerHeroStatsService,
} from '@firestone/battlegrounds/common';
import { BgsPlayer } from '@firestone/game-state';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { currentBgHeroId } from '../../../../services/ui-store/app-ui-store.service';

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
	extends AbstractSubscriptionComponent
	implements AfterContentInit
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

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly heroStats: BgsPlayerHeroStatsService,
		private readonly nav: BattlegroundsNavigationService,
		private readonly mainNav: MainWindowNavigationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.heroStats, this.nav);

		this.selectedTab$ = this.nav.selectedPersonalHeroStatsTab$$.pipe(
			filter((tab) => !!tab),
			this.mapData((tab) => tab),
		);
		this.player$ = combineLatest([this.heroStats.tiersWithPlayerData$$, this.nav.selectedCategoryId$$]).pipe(
			map(([heroStats, selectedCategoryId]) => ({
				heroStats: heroStats,
				heroId: currentBgHeroId(selectedCategoryId),
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

	getLabel(tab: BgsHeroStatsFilterId) {
		return this.i18n.translateString(`app.battlegrounds.personal-stats.hero-details.tabs.${tab}`);
	}

	selectTab(tab: BgsHeroStatsFilterId) {
		this.nav.selectedPersonalHeroStatsTab$$.next(tab);
		this.mainNav.isVisible$$.next(true);
	}
}
