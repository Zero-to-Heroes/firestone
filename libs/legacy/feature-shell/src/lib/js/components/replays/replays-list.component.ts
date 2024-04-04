import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { isBattlegrounds, normalizeHeroCardId } from '@firestone-hs/reference-data';
import { PreferencesService } from '@firestone/shared/common/service';
import { deepEqual } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameStat, toGameTypeEnum } from '@firestone/stats/data-access';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { isMercenaries, isMercenariesPvE, isMercenariesPvP } from '../../services/mercenaries/mercenaries-utils';
import { GameStatsProviderService } from '../../services/stats/game/game-stats-provider.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';

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
				<region-filter-dropdown class="filter"></region-filter-dropdown>
				<replays-game-mode-filter-dropdown class="filter"></replays-game-mode-filter-dropdown>
				<replays-deckstring-filter-dropdown class="filter"></replays-deckstring-filter-dropdown>
				<replays-bg-hero-filter-dropdown class="filter"></replays-bg-hero-filter-dropdown>
				<replays-player-class-filter-dropdown class="filter"></replays-player-class-filter-dropdown>
				<replays-opponent-class-filter-dropdown class="filter"></replays-opponent-class-filter-dropdown>
				<fs-text-input
					class="opponent-search"
					(fsModelUpdate)="onOpponentNameChanged($event)"
					[placeholder]="'app.replays.filters.opponent-search.placeholder' | fsTranslate"
				>
				</fs-text-input>
				<replays-icon-toggle
					class="icon-toggle"
					[ngClass]="{ absolute: !(replaysIconToggleAbsolutePosition$ | async) }"
					*ngIf="showUseClassIconsToggle$ | async"
				></replays-icon-toggle>
				<replays-merc-details-toggle
					class="icon-toggle"
					*ngIf="value.showMercDetailsToggle"
				></replays-merc-details-toggle>
			</div>
			<replays-list-view [replays]="replays$ | async"></replays-list-view>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplaysListComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	replaysIconToggleAbsolutePosition$: Observable<boolean>;
	showUseClassIconsToggle$: Observable<boolean>;
	showMercDetailsToggle$: Observable<boolean>;
	replays$: Observable<readonly GameStat[]>;

	scrollDebounceTime = 0;

	private opponentSearchString$$ = new BehaviorSubject<string>(undefined);

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
		private readonly gameStats: GameStatsProviderService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await Promise.all([this.prefs.isReady(), this.gameStats.isReady()]);

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
		this.replays$ = combineLatest([
			this.gameStats.gameStats$$,
			this.prefs.preferences$$.pipe(
				this.mapData(
					(prefs) => ({
						gameModeFilter: prefs.replaysActiveGameModeFilter,
						bgHeroFilter: prefs.replaysActiveBgHeroFilter,
						deckstringsFilter: prefs.replaysActiveDeckstringsFilter,
						playerClassFilter: prefs.replaysActivePlayerClassFilter,
						opponentClassFilter: prefs.replaysActiveOpponentClassFilter,
					}),
					(a, b) => deepEqual(a, b),
				),
			),
			this.opponentSearchString$$,
		]).pipe(
			filter(([gameStats]) => !!gameStats?.length),
			this.mapData(
				([
					gameStats,
					{ gameModeFilter, bgHeroFilter, deckstringsFilter, playerClassFilter, opponentClassFilter },
					opponentSearchString,
				]) => {
					return this.applyFilters(
						gameStats ?? [],
						gameModeFilter,
						bgHeroFilter,
						deckstringsFilter,
						playerClassFilter,
						opponentClassFilter,
						opponentSearchString,
					);
				},
			),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onScrolling(scrolling: boolean) {
		this.scrollDebounceTime = scrolling ? 1000 : 0;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onOpponentNameChanged(searchString: string) {
		this.opponentSearchString$$.next(searchString);
	}

	private applyFilters(
		replays: readonly GameStat[],
		gameModeFilter: string,
		bgHeroFilter: string,
		deckstringsFilter: readonly string[],
		playerClassFilter: string,
		opponentClassFilter: string,
		opponentSearchString: string,
	): readonly GameStat[] {
		const result = replays
			.filter((replay) => this.gameModeFilter(replay, gameModeFilter))
			.filter((replay) => this.bgHeroFilter(replay, bgHeroFilter, gameModeFilter))
			.filter((replay) => this.deckstringFilter(replay, deckstringsFilter, gameModeFilter))
			.filter((replay) => this.playerClassFilter(replay, playerClassFilter, gameModeFilter))
			.filter((replay) => this.opponentClassFilter(replay, opponentClassFilter, gameModeFilter))
			.filter((replay) => this.opponentNameFilter(replay, opponentSearchString));
		return result;
	}

	private opponentNameFilter(stat: GameStat, filter: string): boolean {
		return !filter || stat.opponentName?.toLowerCase().includes(filter.toLowerCase());
	}

	private playerClassFilter(stat: GameStat, filter: string, gameModeFilter: string): boolean {
		if (!['ranked-standard', 'ranked-wild', 'ranked-classic', 'ranked-twist', 'ranked'].includes(gameModeFilter)) {
			return true;
		}
		if (stat.gameMode !== 'ranked') {
			return true;
		}

		return !filter || stat.playerClass === filter;
	}

	private opponentClassFilter(stat: GameStat, filter: string, gameModeFilter: string): boolean {
		if (!['ranked-standard', 'ranked-wild', 'ranked-classic', 'ranked-twist', 'ranked'].includes(gameModeFilter)) {
			return true;
		}
		if (stat.gameMode !== 'ranked') {
			return true;
		}

		return !filter || stat.opponentClass === filter;
	}

	private deckstringFilter(stat: GameStat, filter: readonly string[], gameModeFilter: string): boolean {
		if (!['ranked-standard', 'ranked-wild', 'ranked-classic', 'ranked-twist', 'ranked'].includes(gameModeFilter)) {
			return true;
		}

		if (stat.gameMode !== 'ranked') {
			return true;
		}

		return !filter?.length || filter.includes(stat.playerDecklist);
	}

	private bgHeroFilter(stat: GameStat, filter: string, gameModeFilter: string): boolean {
		if (gameModeFilter !== 'battlegrounds') {
			return true;
		}

		if (!isBattlegrounds(toGameTypeEnum(stat.gameMode))) {
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
			case 'ranked-twist':
				return gameMode === 'ranked' && format === 'twist';
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
}

export interface HeaderInfo {
	header: string;
}
