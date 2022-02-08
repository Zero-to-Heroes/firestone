import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionComponent } from '@components/abstract-subscription.component';
import { GameType } from '@firestone-hs/reference-data';
import { GameStat } from '@models/mainwindow/stats/game-stat';
import { Preferences } from '@models/preferences';
import { SessionWidgetGroupingType } from '@models/session/types';
import { isBattlegrounds } from '@services/battlegrounds/bgs-utils';
import { CardsFacadeService } from '@services/cards-facade.service';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { GenericPreferencesUpdateEvent } from '@services/mainwindow/store/events/generic-preferences-update-event';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import { groupByFunction } from '@services/utils';
import { combineLatest, Observable } from 'rxjs';

@Component({
	selector: 'current-session-widget',
	styleUrls: ['../../../../css/component/overlays/session/current-session-widget.component.scss'],
	template: `
		<div class="current-session-widget" *ngIf="showWidget$ | async">
			<div class="controls">
				<div class="mode">{{ currentDisplayedMode$ | async }}</div>
				<div class="display">{{ currentGroupingLabel$ | async }}</div>
				<div class="buttons">
					<div
						class="button reset"
						[helpTooltip]="'session.buttons.reset-tooltip' | owTranslate"
						inlineSVG="assets/svg/restore.svg"
						(click)="reset()"
					></div>
					<div
						class="button close"
						[helpTooltip]="'session.buttons.close-tooltip' | owTranslate"
						inlineSVG="assets/svg/close.svg"
						(click)="close()"
					></div>
				</div>
			</div>
			<div class="summary">
				<div class="games">{{ totalGamesLabel$ | async }}</div>
				<div class="rank">
					<div class="current">
						<rank-image
							*ngIf="lastGame$ | async as lastGame"
							class="player-rank"
							[stat]="lastGame"
							[gameMode]="lastGame.gameMode"
						></rank-image>
					</div>
					<ng-container *ngIf="deltaRank$ | async as deltaRank">
						<div
							class="delta"
							*ngIf="deltaRank != null"
							[ngClass]="{
								'positive': deltaRank > 0,
								'negative': deltaRank < 0
							}"
						>
							{{ buildValue(deltaRank, 0) }}
						</div>
					</ng-container>
				</div>
			</div>
			<div class="content">
				<ng-container *ngIf="currentGrouping$ | async as currentGrouping">
					<div class="grouped" *ngIf="currentGrouping === 'grouped'">
						<div class="group" *ngFor="let group of groups$ | async; trackBy: trackByGroupFn">
							<div class="category">{{ group.categoryLabel }}</div>
							<div class="value">{{ group.value }}</div>
							<div class="group-details">
								<div
									class="group-detail"
									*ngFor="let detail of group.details; trackBy: trackByDetailFn"
									[innerHTML]="detail.content"
									[helpTooltip]="detail.tooltip"
								></div>
							</div>
						</div>
					</div>
					<div class="details" *ngIf="currentGrouping === 'list'">Not available for now</div>
				</ng-container>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrentSessionWidgetComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	showWidget$: Observable<boolean>;
	currentDisplayedMode$: Observable<string>;
	currentGrouping$: Observable<SessionWidgetGroupingType>;
	currentGroupingLabel$: Observable<string>;
	totalGamesLabel$: Observable<string>;
	lastGame$: Observable<GameStat>;
	deltaRank$: Observable<number>;
	groups$: Observable<readonly Group[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		const currentGameType$ = this.store
			.listenDeckState$((state) => state?.metadata?.gameType ?? GameType.GT_BATTLEGROUNDS)
			.pipe(this.mapData(([gameType]) => gameType));
		this.showWidget$ = currentGameType$.pipe(this.mapData((gameType) => isBattlegrounds(gameType)));
		this.currentDisplayedMode$ = currentGameType$.pipe(
			this.mapData((gameType) => this.getDisplayModeKey(gameType)),
		);
		this.currentGrouping$ = this.listenForBasicPref$((prefs) => prefs.sessionWidgetGrouping);
		this.currentGroupingLabel$ = this.currentGrouping$.pipe(
			this.mapData((grouping) => this.getGroupingKey(grouping)),
		);

		const lastGames$: Observable<readonly GameStat[]> = combineLatest(
			this.store.listenPrefs$((prefs) => prefs.currentSessionStartDate),
			this.store.listen$(([main, nav, prefs]) => main.stats.gameStats?.stats),
			currentGameType$,
		).pipe(
			this.mapData(([[sessionStartDate], [stats], gameType]) =>
				// Newest game first
				stats
					.filter((stat) => this.gameModeFilter(stat, gameType))
					.filter((stat) => !sessionStartDate || stat.creationTimestamp >= sessionStartDate.getTime()),
			),
		);
		this.totalGamesLabel$ = lastGames$.pipe(
			this.mapData((games) => {
				console.debug('totalGamesLabel', games);
				return this.i18n.translateString('session.summary.total-games', { value: games.length });
			}),
		);
		this.lastGame$ = lastGames$.pipe(
			this.mapData((games) => {
				const lastGame = games[0];
				return !!lastGame ? lastGame.update({ playerRank: lastGame.newPlayerRank }) : null;
			}),
		);
		this.deltaRank$ = combineLatest(lastGames$, currentGameType$).pipe(
			this.mapData(([games, currentGameType]) => {
				if (!isBattlegrounds(currentGameType)) {
					return null;
				}

				let startingRank: number = null;
				for (const game of [...games].reverse()) {
					if (game.playerRank != null && !isNaN(parseInt(game.playerRank))) {
						startingRank = parseInt(game.playerRank);
						break;
					} else if (game.newPlayerRank != null && !isNaN(parseInt(game.newPlayerRank))) {
						startingRank = parseInt(game.newPlayerRank);
						break;
					}
				}

				let finishRank: number = null;
				for (const game of games) {
					if (game.newPlayerRank != null && !isNaN(parseInt(game.newPlayerRank))) {
						finishRank = parseInt(game.newPlayerRank);
						break;
					} else if (game.playerRank != null && !isNaN(parseInt(game.playerRank))) {
						finishRank = parseInt(game.playerRank);
						break;
					}
				}

				if (startingRank == null || finishRank == null) {
					return null;
				}
				return finishRank - startingRank;
			}),
		);
		this.groups$ = combineLatest(lastGames$, currentGameType$).pipe(
			this.mapData(([games, currentGameType]) => {
				if (isBattlegrounds(currentGameType)) {
					return this.buildBgsGroups(games);
				}
				return null;
			}),
		);
	}

	buildValue(value: number, decimals = 2): string {
		if (value === 100) {
			return '100';
		}
		return !value ? '-' : value.toFixed(decimals);
	}

	trackByGroupFn(index: number, item: Group) {
		return item.category;
	}

	trackByDetailFn(index: number, item: Detail) {
		return item.id;
	}

	reset() {
		console.log('resetting session widget');
		this.store.send(
			new GenericPreferencesUpdateEvent((prefs: Preferences) => ({
				...prefs,
				currentSessionStartDate: new Date(),
			})),
		);
	}

	close() {
		console.log('closing session widget');
		this.store.send(
			new GenericPreferencesUpdateEvent((prefs: Preferences) => ({
				...prefs,
				showCurrentSessionWidget: false,
			})),
		);
	}

	private getGroupingKey(grouping: SessionWidgetGroupingType): string {
		switch (grouping) {
			case 'grouped':
				return this.i18n.translateString('session.grouping.grouped');
			case 'list':
				return this.i18n.translateString('session.grouping.list');
		}
	}

	private getDisplayModeKey(gameType: GameType): string {
		switch (gameType) {
			case GameType.GT_BATTLEGROUNDS:
			case GameType.GT_BATTLEGROUNDS_AI_VS_AI:
			case GameType.GT_BATTLEGROUNDS_FRIENDLY:
				return this.i18n.translateString('session.display-mode.battlegrounds');
			default:
				return this.i18n.translateString('session.display-mode.unknown');
		}
	}

	private gameModeFilter(stat: GameStat, gameType: GameType): boolean {
		switch (gameType) {
			case GameType.GT_BATTLEGROUNDS:
			case GameType.GT_BATTLEGROUNDS_AI_VS_AI:
			case GameType.GT_BATTLEGROUNDS_FRIENDLY:
				return stat.gameMode === 'battlegrounds';
			default:
				return false;
		}
	}

	private buildBgsGroups(games: readonly GameStat[]): readonly Group[] {
		const gamesWithFinalPosition = games.filter(
			(game) => game.additionalResult && !isNaN(parseInt(game.additionalResult)),
		);
		const groupedByPosition = groupByFunction((game: GameStat) => game.additionalResult)(gamesWithFinalPosition);
		const allPositions: readonly number[] = [...Array(8).keys()].map((key) => key + 1);
		return allPositions.map((position) => {
			const gamesForPosition = groupedByPosition[position] ?? [];
			return {
				category: `${position}`,
				categoryLabel: this.i18n.translateString(`session.groups.battlegrounds.category.${position}`),
				value: gamesForPosition.length,
				details: this.buildBgsDetails(gamesForPosition),
			};
		});
	}

	private buildBgsDetails(gamesForPosition: readonly GameStat[]): readonly Detail[] {
		return gamesForPosition.slice(0, 5).map((game) => {
			return {
				id: game.reviewId,
				content: `
					<div class="session-widget-detail-content">
						<img class="icon" src="https://static.zerotoheroes.com/hearthstone/cardart/256x/${game.playerCardId}.jpg" />
					</div>
				`,
				tooltip: this.allCards.getCard(game.playerCardId).name,
			};
		});
	}
}

interface Group {
	readonly category: string;
	readonly categoryLabel: string;
	readonly value: number;
	readonly details: readonly Detail[];
}

interface Detail {
	readonly id: string;
	readonly content: string; // HTML content
	readonly tooltip: string;
}
