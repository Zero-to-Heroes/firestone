import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { GroupedReplays } from '../../models/mainwindow/replays/grouped-replays';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { normalizeHeroCardId } from '../../services/battlegrounds/bgs-utils';
import { isMercenaries, isMercenariesPvE, isMercenariesPvP } from '../../services/mercenaries/mercenaries-utils';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { groupByFunction } from '../../services/utils';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

@Component({
	selector: 'replays-list',
	styleUrls: [`../../../css/component/replays/replays-list.component.scss`],
	template: `
		<div
			class="replays-container"
			*ngIf="{
				showMercDetailsToggle: showMercDetailsToggle$ | async
			} as value"
		>
			<div class="filters">
				<replays-game-mode-filter-dropdown class="filter"></replays-game-mode-filter-dropdown>
				<replays-deckstring-filter-dropdown class="filter"></replays-deckstring-filter-dropdown>
				<replays-bg-hero-filter-dropdown class="filter"></replays-bg-hero-filter-dropdown>
				<replays-player-class-filter-dropdown class="filter"></replays-player-class-filter-dropdown>
				<replays-icon-toggle
					class="icon-toggle"
					[ngClass]="{ 'absolute': !(replaysIconToggleAbsolutePosition$ | async) }"
					*ngIf="showUseClassIconsToggle$ | async"
				></replays-icon-toggle>
				<replays-merc-details-toggle
					class="icon-toggle"
					*ngIf="value.showMercDetailsToggle"
				></replays-merc-details-toggle>
			</div>
			<virtual-scroller
				#scroll
				*ngIf="replays$ | async as replays; else emptyState"
				class="replays-list"
				[items]="replays"
				bufferAmount="5"
				[scrollDebounceTime]="scrollDebounceTime"
				scrollable
				(scrolling)="onScrolling($event)"
			>
				<!-- Because the virtual-scroller needs elements of the same size to work, we can't give it groups -->
				<ng-container *ngFor="let replay of scroll.viewPortItems; trackBy: trackByReplay">
					<div class="header" *ngIf="replay.header">{{ replay.header }}</div>
					<replay-info class="replay" *ngIf="!replay.header" [replay]="replay"></replay-info>
				</ng-container>
			</virtual-scroller>

			<ng-template #emptyState>
				<section class="empty-state">
					<div class="state-container">
						<i class="i-236X165">
							<svg>
								<use xlink:href="assets/svg/sprite.svg#empty_state_replays" />
							</svg>
						</i>
						<span class="title" [owTranslate]="'app.replays.list.empty-state-title'"></span>
						<span class="subtitle" [owTranslate]="'app.replays.list.empty-state-subtitle'"></span>
					</div>
				</section>
			</ng-template>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplaysListComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	replaysIconToggleAbsolutePosition$: Observable<boolean>;
	showUseClassIconsToggle$: Observable<boolean>;
	showMercDetailsToggle$: Observable<boolean>;
	replays$: Observable<readonly (GameStat | HeaderInfo)[]>;

	scrollDebounceTime = 0;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.showUseClassIconsToggle$ = this.listenForBasicPref$((prefs) => prefs.replaysActiveGameModeFilter).pipe(
			this.mapData(
				(gameModeFilter) =>
					!['battlegrounds'].includes(gameModeFilter) && !gameModeFilter?.startsWith('mercenaries'),
			),
		);
		this.showMercDetailsToggle$ = this.listenForBasicPref$((prefs) => prefs.replaysActiveGameModeFilter).pipe(
			this.mapData((gameModeFilter) => gameModeFilter?.startsWith('mercenaries')),
		);
		this.replaysIconToggleAbsolutePosition$ = this.listenForBasicPref$(
			(prefs) => prefs.replaysActiveGameModeFilter,
		).pipe(
			this.mapData(
				(gameModeFilter) =>
					[
						null,
						undefined,
						'battlegrounds',
						'practice',
						'mercenaries-all',
						'mercenaries-pve',
						'mercenaries-pvp',
					].includes(gameModeFilter) || gameModeFilter?.startsWith('mercenaries'),
			),
		);
		this.replays$ = this.store
			.listen$(
				([main, nav]) => main.replays.allReplays,
				([main, nav, prefs]) => prefs.replaysActiveGameModeFilter,
				([main, nav, prefs]) => prefs.replaysActiveBgHeroFilter,
				([main, nav, prefs]) => prefs.replaysActiveDeckstringFilter,
				([main, nav, prefs]) => prefs.replaysActivePlayerClassFilter,
				([main, nav, prefs]) => prefs.replaysActiveOpponentClassFilter,
			)
			.pipe(
				filter(([gameStats]) => !!gameStats?.length),
				this.mapData(
					([
						gameStats,
						gameModeFilter,
						bgHeroFilter,
						deckstringFilter,
						playerClassFilter,
						opponentClassFilter,
					]) => {
						const allReplays = this.applyFilters(
							gameStats ?? [],
							gameModeFilter,
							bgHeroFilter,
							deckstringFilter,
							playerClassFilter,
							opponentClassFilter,
						);
						const groupedReplays = this.groupReplays(allReplays);
						const flat = groupedReplays
							.filter((group) => group?.replays?.length)
							.flatMap((group) => {
								return [
									{
										header: group.header,
									} as HeaderInfo,
									...group.replays,
								];
							});
						return flat;
					},
				),
			);
	}

	onScrolling(scrolling: boolean) {
		this.scrollDebounceTime = scrolling ? 1000 : 0;
		console.debug('handling scrolling in parent', scrolling, this.scrollDebounceTime);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByReplay(index: number, item: GameStat | HeaderInfo) {
		return (item as GameStat).reviewId ?? (item as HeaderInfo)?.header;
	}

	private applyFilters(
		replays: readonly GameStat[],
		gameModeFilter: string,
		bgHeroFilter: string,
		deckstringFilter: string,
		playerClassFilter: string,
		opponentClassFilter: string,
	): readonly GameStat[] {
		return replays
			.filter((replay) => this.gameModeFilter(replay, gameModeFilter))
			.filter((replay) => this.bgHeroFilter(replay, bgHeroFilter))
			.filter((replay) => this.deckstringFilter(replay, deckstringFilter))
			.filter((replay) => this.playerClassFilter(replay, playerClassFilter))
			.filter((replay) => this.opponentClassFilter(replay, opponentClassFilter));
	}

	private playerClassFilter(stat: GameStat, filter: string): boolean {
		if (stat.gameMode !== 'ranked') {
			return true;
		}

		return !filter || stat.playerClass === filter;
	}

	private opponentClassFilter(stat: GameStat, filter: string): boolean {
		if (stat.gameMode !== 'ranked') {
			return true;
		}

		return !filter || stat.opponentClass === filter;
	}

	private deckstringFilter(stat: GameStat, filter: string): boolean {
		if (stat.gameMode !== 'ranked') {
			return true;
		}

		return !filter || stat.playerDecklist === filter;
	}

	private bgHeroFilter(stat: GameStat, filter: string): boolean {
		if (stat.gameMode !== 'battlegrounds') {
			return true;
		}

		return !filter || normalizeHeroCardId(stat.playerCardId, this.allCards) === filter;
	}

	private gameModeFilter(stat: GameStat, filter: string): boolean {
		const gameMode = stat.gameMode;
		const format = stat.gameFormat;
		switch (filter) {
			case null:
				return !isMercenariesPvE(gameMode);
			case 'both-duels':
				return gameMode === 'duels' || gameMode === 'paid-duels';
			case 'ranked-standard':
				return gameMode === 'ranked' && format === 'standard';
			case 'ranked-wild':
				return gameMode === 'ranked' && format === 'wild';
			case 'ranked-classic':
				return gameMode === 'ranked' && format === 'classic';
			case 'mercenaries-all':
				return isMercenaries(gameMode);
			case 'mercenaries-pve':
				return isMercenariesPvE(gameMode);
			case 'mercenaries-pvp':
				return isMercenariesPvP(gameMode);
			default:
				return gameMode === filter;
		}
	}

	private groupReplays(replays: readonly GameStat[]): readonly GroupedReplays[] {
		const groupingFunction = (replay: GameStat) => {
			const date = new Date(replay.creationTimestamp);
			return date.toLocaleDateString(this.i18n.formatCurrentLocale(), {
				month: 'short',
				day: '2-digit',
				year: 'numeric',
			});
		};
		const groupByDate = groupByFunction(groupingFunction);
		const replaysByDate = groupByDate(replays);
		return Object.keys(replaysByDate).map((date) => ({
			header: date,
			replays: replaysByDate[date],
		}));
	}
}

interface HeaderInfo {
	header: string;
}
