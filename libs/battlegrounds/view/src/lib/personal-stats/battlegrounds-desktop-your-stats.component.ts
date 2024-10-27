import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { normalizeHeroCardId } from '@firestone-hs/reference-data';
import { BgsActiveTimeFilterType } from '@firestone/battlegrounds/data-access';
import {
	BgsRankFilterType,
	PatchesConfigService,
	PatchInfo,
	PreferencesService,
} from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, deepEqual, groupByFunction } from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { GameStat, GameStatsLoaderService } from '@firestone/stats/data-access';
import { combineLatest, distinctUntilChanged, Observable, shareReplay, takeUntil } from 'rxjs';
import { BattlegroundsYourStat } from './your-stats.model';

@Component({
	selector: 'battlegrounds-desktop-your-stats',
	styleUrls: [`./battlegrounds-personal-stats-columns.scss`, `./battlegrounds-desktop-your-stats.component.scss`],
	template: `
		<section class="battlegrounds-desktop-your-stats">
			<div class="summary">
				<!-- Total time played (since time of first game recorded) -->
				<!-- Placement summary -->
				<!-- MMR Graph (small)? -->
			</div>
			<div class="stats">
				<div class="header">
					<div class="portrait"></div>
					<div class="hero-details" [fsTranslate]="'app.battlegrounds.tier-list.header-hero-details'"></div>
					<div class="position" [fsTranslate]="'app.battlegrounds.tier-list.header-average-position'"></div>
					<div
						class="player-games-played"
						[fsTranslate]="'app.battlegrounds.tier-list.header-games-played'"
						[helpTooltip]="'app.battlegrounds.tier-list.header-games-played-tooltip' | fsTranslate"
					></div>
					<div
						class="net-mmr"
						[fsTranslate]="'app.battlegrounds.tier-list.header-net-mmr'"
						[helpTooltip]="'app.battlegrounds.personal-stats.hero.net-mmr-tooltip' | fsTranslate"
					></div>
				</div>
				<div class="stats-list">
					<battlegrounds-presonal-stats-info
						*ngFor="let stat of stats$ | async"
						[stat]="stat"
					></battlegrounds-presonal-stats-info>
				</div>
			</div>
		</section>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsDesktopYourStatsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	stats$: Observable<readonly BattlegroundsYourStat[]>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly gameStats: GameStatsLoaderService,
		private readonly allCards: CardsFacadeService,
		private readonly patch: PatchesConfigService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.gameStats, this.patch);

		const prefs$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => ({
				mode: prefs.bgsActiveGameMode,
				time: prefs.bgsActiveTimeFilter,
				rank: prefs.bgsActiveRankFilter,
			})),
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);

		const bgGames$ = this.gameStats.gameStats$$.pipe(
			this.mapData((stats) => stats?.stats?.filter((stat) => stat.isBattlegrounds())),
			distinctUntilChanged((a, b) => a.length === b.length),
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);

		const filteredGames$ = combineLatest([bgGames$, prefs$, this.patch.currentBattlegroundsMetaPatch$$]).pipe(
			this.mapData(([games, prefs, patch]) =>
				games
					.filter((game) => this.filterGameMode(game, prefs.mode))
					.filter((game) => this.filterTime(game, prefs.time, patch))
					.filter((game) => this.filterRank(game, prefs.rank)),
			),
			distinctUntilChanged((a, b) => a.length === b.length),
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);

		const statsType$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.bgsYourStatsTypeFilter),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);

		const unsortedStats$ = combineLatest([filteredGames$, statsType$]).pipe(
			this.mapData(([games, statsType]) => this.buildStats(games, statsType)),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private buildStats(games: readonly GameStat[], statsType: 'hero' | 'trinket'): readonly BattlegroundsYourStat[] {
		switch (statsType) {
			case 'hero':
				return this.buildHeroStats(games);
			case 'trinket':
				return this.buildTrinketStats(games);
		}
	}

	private buildHeroStats(games: readonly GameStat[]): readonly BattlegroundsYourStat[] {
		const groupedByHero = groupByFunction((game: GameStat) =>
			normalizeHeroCardId(game.playerCardId, this.allCards),
		)(games);
		return Object.keys(groupedByHero).map((heroCardId) => {
			const heroGames = groupedByHero[heroCardId].filter((g) => !!+g.playerRank);
			const gamesWithMmrInfo = heroGames.filter((g) => g.playerRank != null && g.newPlayerRank != null);
			const totalMmr = gamesWithMmrInfo.map((g) => +g.newPlayerRank - +g.playerRank).reduce((a, b) => a + b, 0);
			const result: BattlegroundsYourStat = {
				cardId: heroCardId,
				name: this.allCards.getCard(heroCardId)?.name,
				totalMatches: heroGames.length,
				averagePosition:
					heroGames.map((game) => +game.playerRank).reduce((a, b) => a + b, 0) / heroGames.length,
				placementDistribution: this.buildPlacementDistribution(heroGames),
				pickRate: null,
				netMmr: gamesWithMmrInfo?.length ? totalMmr / gamesWithMmrInfo.length : null,
			};
			return result;
		});
	}

	private buildPlacementDistribution(
		games: readonly GameStat[],
	): readonly { readonly placement: number; readonly totalMatches: number }[] {
		const distribution = [];
		for (let i = 1; i <= 8; i++) {
			const totalMatches = games.filter((game) => +game.playerRank === i).length;
			distribution.push({ placement: i, totalMatches: totalMatches });
		}
		return distribution;
	}

	private filterGameMode(game: GameStat, mode: 'battlegrounds' | 'battlegrounds-duo'): boolean {
		return game.gameMode === mode;
	}

	private filterTime(game: GameStat, time: BgsActiveTimeFilterType, patch: PatchInfo): boolean {
		switch (time) {
			case 'all-time':
				return true;
			case 'past-three':
				return game.creationTimestamp > Date.now() - 3 * 24 * 60 * 60 * 1000;
			case 'past-seven':
				return game.creationTimestamp > Date.now() - 7 * 24 * 60 * 60 * 1000;
			case 'last-patch':
				return game.creationTimestamp > new Date(patch.date).getTime();
		}
	}

	private filterRank(game: GameStat, rank: BgsRankFilterType): boolean {
		return true;
	}

	private buildTrinketStats(games: readonly GameStat[]): readonly BattlegroundsYourStat[] {
		return [];
	}
}
