import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, takeUntil, tap } from 'rxjs/operators';
import { GroupedReplays } from '../../models/mainwindow/replays/grouped-replays';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { normalizeHeroCardId } from '../../services/battlegrounds/bgs-utils';
import { isMercenaries, isMercenariesPvE, isMercenariesPvP } from '../../services/mercenaries/mercenaries-utils';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../services/ui-store/app-ui-store.service';
import { arraysEqual, groupByFunction } from '../../services/utils';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

@Component({
	selector: 'replays-list',
	styleUrls: [`../../../css/component/replays/replays-list.component.scss`],
	template: `
		<div class="replays-container">
			<div class="filters">
				<replays-game-mode-filter-dropdown class="filter"></replays-game-mode-filter-dropdown>
				<replays-deckstring-filter-dropdown class="filter"></replays-deckstring-filter-dropdown>
				<replays-bg-hero-filter-dropdown class="filter"></replays-bg-hero-filter-dropdown>
				<replays-player-class-filter-dropdown class="filter"></replays-player-class-filter-dropdown>
				<replays-icon-toggle
					class="icon-toggle"
					[ngClass]="{ 'absolute': !(replaysIconToggleAbsolutePosition$ | async) }"
				></replays-icon-toggle>
			</div>
			<infinite-scroll *ngIf="allReplays?.length" class="replays-list" (scrolled)="onScroll()" scrollable>
				<li *ngFor="let groupedReplay of displayedGroupedReplays">
					<grouped-replays [groupedReplays]="groupedReplay"></grouped-replays>
				</li>
				<div class="loading" *ngIf="isLoading" (click)="onScroll()">Click to load more replays...</div>
			</infinite-scroll>
			<section class="empty-state" *ngIf="!allReplays?.length">
				<div class="state-container">
					<i class="i-236X165">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#empty_state_replays" />
						</svg>
					</i>
					<span class="title">Nothing here yet</span>
					<span class="subtitle">Play a match to get started</span>
				</div>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplaysListComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	replaysIconToggleAbsolutePosition$: Observable<boolean>;

	isLoading: boolean;
	allReplays: readonly GameStat[];
	displayedGroupedReplays: readonly GroupedReplays[] = [];

	private sub$$: Subscription;
	private displayedReplays: readonly GameStat[] = [];
	private gamesIterator: IterableIterator<void>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
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
		this.sub$$ = this.store
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
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				tap((stat) => cdLog('emitting in ', this.constructor.name, stat)),
				takeUntil(this.destroyed$),
			)
			.subscribe(
				([
					gameStats,
					gameModeFilter,
					bgHeroFilter,
					deckstringFilter,
					playerClassFilter,
					opponentClassFilter,
				]) => {
					// Otherwise the generator is simply closed at the end of the first onScroll call
					setTimeout(() => {
						this.displayedReplays = [];
						this.displayedGroupedReplays = [];
						this.gamesIterator = this.buildIterator(
							gameStats,
							gameModeFilter,
							bgHeroFilter,
							deckstringFilter,
							playerClassFilter,
							opponentClassFilter,
						);
						this.onScroll();
					});
				},
			);
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		super.ngOnDestroy();
		this.sub$$?.unsubscribe();
	}

	onScroll() {
		this.gamesIterator && this.gamesIterator.next();
	}

	private *buildIterator(
		replays: readonly GameStat[],
		gameModeFilter: string,
		bgHeroFilter: string,
		deckstringFilter: string,
		playerClassFilter: string,
		opponentClassFilter: string,
		step = 40,
	): IterableIterator<void> {
		this.allReplays = this.applyFilters(
			replays ?? [],
			gameModeFilter,
			bgHeroFilter,
			deckstringFilter,
			playerClassFilter,
			opponentClassFilter,
		);
		const workingReplays = [...this.allReplays];
		while (workingReplays.length > 0) {
			const currentReplays = [];
			while (workingReplays.length > 0 && currentReplays.length < step) {
				currentReplays.push(...workingReplays.splice(0, 1));
			}
			this.displayedReplays = [...this.displayedReplays, ...currentReplays];
			this.displayedGroupedReplays = this.groupReplays(this.displayedReplays);
			this.isLoading = this.allReplays.length > step;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			yield;
		}
		this.isLoading = false;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		return;
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

		return !filter || normalizeHeroCardId(stat.playerCardId) === filter;
	}

	private gameModeFilter(stat: GameStat, filter: string): boolean {
		if (!filter) {
			return true;
		}

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
			return date.toLocaleDateString('en-US', {
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
