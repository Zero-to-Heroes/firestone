import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CardClass } from '@firestone-hs/reference-data';
import { SortCriteria, SortDirection, invertDirection } from '@firestone/shared/common/view';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@legacy-import/src/lib/js/services/localization-facade.service';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';
import { ClassInfo, ModeOverview } from './profile-match-stats.model';

@Component({
	selector: 'profile-match-stats',
	styleUrls: [
		`../../../../../css/component/stats/desktop/match-stats/profile-match-stats-columns.scss`,
		`../../../../../css/component/stats/desktop/match-stats/profile-match-stats.component.scss`,
	],
	template: `
		<div
			class="player-match-stats"
			*ngIf="{ currentMode: currentMode$ | async, missingContentText: missingContentText$ | async } as value"
		>
			<div class="mode-selection">
				<profile-match-stats-mode-overview
					class="mode-overview"
					*ngFor="let overview of modeOverviews$ | async"
					[overview]="overview"
					[active]="overview.mode === value.currentMode"
					(click)="selectMode(overview.mode)"
				>
				</profile-match-stats-mode-overview>
			</div>
			<div class="content" *ngIf="!value.missingContentText?.length; else emptyState">
				<div class="stats-header" *ngIf="sortCriteria$ | async as sort">
					<sortable-table-label
						class="cell player-class"
						[name]="'app.profile.match-stats.header-player-class' | owTranslate"
						[sort]="sort"
						[criteria]="'name'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell winrate"
						[name]="'app.profile.match-stats.header-winrate' | owTranslate"
						[sort]="sort"
						[criteria]="'winrate'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell total-matches"
						[name]="'app.profile.match-stats.header-total-matches' | owTranslate"
						[sort]="sort"
						[criteria]="'total-matches'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell wins"
						*ngIf="value.currentMode !== 'battlegrounds'"
						[name]="'app.profile.match-stats.header-wins' | owTranslate"
						[sort]="sort"
						[criteria]="'wins'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell losses"
						*ngIf="value.currentMode !== 'battlegrounds'"
						[name]="'app.profile.match-stats.header-losses' | owTranslate"
						[sort]="sort"
						[criteria]="'losses'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell top-1"
						*ngIf="value.currentMode === 'battlegrounds'"
						[name]="'app.profile.match-stats.header-top-1' | owTranslate"
						[sort]="sort"
						[criteria]="'top-1'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell top-4"
						*ngIf="value.currentMode === 'battlegrounds'"
						[name]="'app.profile.match-stats.header-top-4' | owTranslate"
						[sort]="sort"
						[criteria]="'top-4'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
				</div>
				<div class="stats-content">
					<profile-match-stats-class-info
						class="class-info"
						*ngFor="let classInfo of classInfos$ | async"
						[classInfo]="classInfo"
						[currentMode]="value.currentMode"
					>
					</profile-match-stats-class-info>
				</div>
			</div>
			<ng-template #emptyState>
				<duels-empty-state
					class="empty-state"
					[title]="'app.profile.match-stats.no-data.title' | owTranslate"
					[subtitle]="missingContentText$ | async"
				>
				</duels-empty-state>
			</ng-template>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileMatchStatsComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	modeOverviews$: Observable<readonly ModeOverview[]>;
	currentMode$: Observable<'constructed' | 'duels' | 'arena' | 'battlegrounds'>;
	classInfos$: Observable<readonly ClassInfo[]>;
	sortCriteria$: Observable<SortCriteria<ColumnSortType>>;
	missingContentText$: Observable<string>;

	private currentMode$$ = new BehaviorSubject<'constructed' | 'duels' | 'arena' | 'battlegrounds'>('constructed');
	private sortCriteria$$ = new BehaviorSubject<SortCriteria<ColumnSortType>>({
		criteria: null,
		direction: 'asc',
	});

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.currentMode$ = this.currentMode$$.asObservable();
		this.sortCriteria$ = this.sortCriteria$$.asObservable();
		this.classInfos$ = combineLatest([
			this.store.profileClassesProgress$(),
			this.store.profileBgHeroStat$(),
			this.store.profileDuelsHeroStats$(),
			this.currentMode$,
			this.sortCriteria$$,
		]).pipe(
			this.mapData(([classProgress, bgHeroStat, duelsHeroStats, currentMode, sortCriteria]) => {
				console.debug('building class infos', classProgress, currentMode, sortCriteria);
				const hsClassProgress: readonly ClassInfo[] =
					currentMode === 'constructed' || currentMode === 'arena'
						? classProgress.map((info) => {
								const lowerCaseClass = CardClass[info.playerClass]?.toLowerCase();
								const gamesForMode = info.winsForModes.find((info) => info.mode === currentMode) ?? {
									wins: 0,
									losses: 0,
									ties: 0,
								};
								const classInfo: ClassInfo = {
									playerClass: CardClass[info.playerClass],
									icon: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${lowerCaseClass}.png`,
									name: this.i18n.translateString(`global.class.${lowerCaseClass}`),
									totalMatches: gamesForMode.losses + gamesForMode.wins + gamesForMode.ties,
									wins: gamesForMode.wins,
									losses: gamesForMode.losses,
									winrate:
										gamesForMode.wins + gamesForMode.losses === 0
											? null
											: (100 * gamesForMode.wins) / (gamesForMode.wins + gamesForMode.losses),
								};
								return classInfo;
						  })
						: [];
				const bgClassProgress: readonly ClassInfo[] =
					currentMode === 'battlegrounds'
						? bgHeroStat.map((info) => {
								const classInfo: ClassInfo = {
									playerClass: info.heroCardId,
									icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${info.heroCardId}.jpg`,
									name: this.allCards.getCard(info.heroCardId).name,
									top1: info.top1,
									top4: info.top4,
									totalMatches: info.gamesPlayed,
									winrate: info.gamesPlayed === 0 ? null : (100 * info.top4) / info.gamesPlayed,
								};
								return classInfo;
						  })
						: [];
				const duelsClassProgress: readonly ClassInfo[] =
					currentMode === 'duels'
						? duelsHeroStats.map((info) => {
								const classInfo: ClassInfo = {
									playerClass: info.heroCardId,
									icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${info.heroCardId}.jpg`,
									name: this.allCards.getCard(info.heroCardId).name,
									totalMatches: info.wins + info.losses,
									wins: info.wins,
									losses: info.losses,
									winrate:
										info.wins + info.losses === 0
											? null
											: (100 * info.wins) / (info.wins + info.losses),
								};
								return classInfo;
						  })
						: [];
				return [...hsClassProgress, ...bgClassProgress, ...duelsClassProgress].sort((a, b) =>
					this.sortClassProgress(a, b, sortCriteria),
				);
			}),
		);

		this.modeOverviews$ = combineLatest([
			this.store.profileClassesProgress$(),
			this.store.profileBgHeroStat$(),
			this.store.profileDuelsHeroStats$(),
		]).pipe(
			this.mapData(([classProgress, bgHeroStat, duelsHeroStats]) => {
				const modes = ['constructed', 'arena'] as const;
				const hsModes = modes.map((mode) => {
					console.debug('getting wins for mode', mode, classProgress);
					const wins = classProgress
						.map((info) => info.winsForModes.find((info) => info.mode === mode)?.wins ?? 0)
						.reduce((a, b) => a + b, 0);
					const losses = classProgress
						.map((info) => info.winsForModes.find((info) => info.mode === mode)?.losses ?? 0)
						.reduce((a, b) => a + b, 0);
					// const ties = classProgress
					// 	.map((info) => info.winsForModes.find((info) => info.mode === mode).ties)
					// 	.reduce((a, b) => a + b, 0);
					const result: ModeOverview = {
						mode: mode,
						title: this.i18n.translateString(`global.game-mode.${mode}`),
						icon: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/mode/${mode}.webp?v=2`,
						wins: wins,
						losses: losses,
						winrate: wins + losses === 0 ? null : (100 * wins) / (wins + losses),
						winsTooltip: this.i18n.translateString('app.profile.match-stats.header-wins'),
					};
					return result;
				});

				const top1 = bgHeroStat.map((info) => info.top1).reduce((a, b) => a + b, 0);
				const top4 = bgHeroStat.map((info) => info.top4).reduce((a, b) => a + b, 0);
				const gamesPlayed = bgHeroStat.map((info) => info.gamesPlayed).reduce((a, b) => a + b, 0);
				const bgMode: ModeOverview = {
					mode: 'battlegrounds',
					title: this.i18n.translateString(`global.game-mode.battlegrounds`),
					icon: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/mode/battlegrounds.webp?v=2`,
					wins: top4,
					top1: top1,
					top1Tooltip: this.i18n.translateString('app.profile.match-stats.overview-top-1', {
						value: `${top1}`,
					}),
					// top4: top4,
					losses: gamesPlayed - top1 - top4,
					// gamesPlayed: gamesPlayed,
					winrate: gamesPlayed === 0 ? null : (100 * (top1 + top4)) / gamesPlayed,
					winsTooltip: this.i18n.translateString('app.profile.match-stats.header-wins-bg', {
						first: top1,
					}),
				};

				const duelsWins = duelsHeroStats.map((info) => info.wins).reduce((a, b) => a + b, 0);
				const duelsLosses = duelsHeroStats.map((info) => info.losses).reduce((a, b) => a + b, 0);
				const duelsMode: ModeOverview = {
					mode: 'duels',
					title: this.i18n.translateString(`global.game-mode.duels`),
					icon: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/mode/duels.webp?v=2`,
					wins: duelsWins,
					losses: duelsLosses,
					winrate: duelsWins + duelsLosses === 0 ? null : (100 * duelsWins) / (duelsWins + duelsLosses),
					winsTooltip: this.i18n.translateString('app.profile.match-stats.header-wins'),
				};
				return [...hsModes, bgMode, duelsMode];
			}),
		);

		this.missingContentText$ = combineLatest([this.modeOverviews$, this.currentMode$]).pipe(
			this.mapData(([modeOverviews, currentMode]) => {
				switch (currentMode) {
					case 'constructed':
						console.debug();
						return !!modeOverviews.find((m) => m.mode === 'constructed')?.wins
							? null
							: this.i18n.translateString('app.profile.match-stats.no-data.ranked');
					case 'arena':
						return !!modeOverviews.find((m) => m.mode === 'arena')?.wins
							? null
							: this.i18n.translateString('app.profile.match-stats.no-data.arena');
					case 'battlegrounds':
						return !!modeOverviews.find((m) => m.mode === 'battlegrounds')?.wins
							? null
							: this.i18n.translateString('app.profile.match-stats.no-data.battlegrounds');
					case 'duels':
						return !!modeOverviews.find((m) => m.mode === 'duels')?.wins
							? null
							: this.i18n.translateString('app.profile.match-stats.no-data.duels');
				}
			}),
		);
	}

	selectMode(mode: 'constructed' | 'duels' | 'arena' | 'battlegrounds') {
		this.currentMode$$.next(mode);
	}

	onSortClick(rawCriteria: string) {
		const criteria: ColumnSortType = rawCriteria as ColumnSortType;
		this.sortCriteria$$.next({
			criteria: criteria,
			direction:
				criteria === this.sortCriteria$$.value?.criteria
					? invertDirection(this.sortCriteria$$.value.direction)
					: 'desc',
		});
	}

	private sortClassProgress(a: ClassInfo, b: ClassInfo, sortCriteria: SortCriteria<ColumnSortType>): number {
		switch (sortCriteria?.criteria) {
			case 'name':
				return this.sortByName(a, b, sortCriteria.direction);
			case 'winrate':
				return this.sortByWinrate(a, b, sortCriteria.direction);
			case 'total-matches':
				return this.sortByTotalMatches(a, b, sortCriteria.direction);
			case 'wins':
				return this.sortByWins(a, b, sortCriteria.direction);
			case 'losses':
				return this.sortByLosses(a, b, sortCriteria.direction);
			case 'top-1':
				return this.sortByTop1(a, b, sortCriteria.direction);
			case 'top-4':
				return this.sortByTop4(a, b, sortCriteria.direction);
			default:
				return 0;
		}
	}

	private sortByName(a: ClassInfo, b: ClassInfo, direction: SortDirection): number {
		return direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
	}

	private sortByWinrate(a: ClassInfo, b: ClassInfo, direction: SortDirection): number {
		if (a.winrate === null) {
			return direction === 'asc' ? -1 : 1;
		}
		if (b.winrate === null) {
			return direction === 'asc' ? 1 : -1;
		}
		return direction === 'asc' ? a.winrate - b.winrate : b.winrate - a.winrate;
	}

	private sortByTotalMatches(a: ClassInfo, b: ClassInfo, direction: SortDirection): number {
		return direction === 'asc' ? a.totalMatches - b.totalMatches : b.totalMatches - a.totalMatches;
	}

	private sortByWins(a: ClassInfo, b: ClassInfo, direction: SortDirection): number {
		return direction === 'asc' ? a.wins - b.wins : b.wins - a.wins;
	}

	private sortByLosses(a: ClassInfo, b: ClassInfo, direction: SortDirection): number {
		return direction === 'asc' ? a.losses - b.losses : b.losses - a.losses;
	}

	private sortByTop1(a: ClassInfo, b: ClassInfo, direction: SortDirection): number {
		return direction === 'asc' ? a.top1 - b.top1 : b.top1 - a.top1;
	}

	private sortByTop4(a: ClassInfo, b: ClassInfo, direction: SortDirection): number {
		return direction === 'asc' ? a.top4 - b.top4 : b.top4 - a.top4;
	}
}

export type ColumnSortType = 'name' | 'winrate' | 'total-matches' | 'wins' | 'losses' | 'top-1' | 'top-4';
