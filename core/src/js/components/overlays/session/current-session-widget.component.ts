import { ComponentType } from '@angular/cdk/portal';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionComponent } from '@components/abstract-subscription.component';
import { CurrentSessionBgsBoardTooltipComponent } from '@components/overlays/session/current-session-bgs-board-tooltip.component';
import { GameType } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { GameStat } from '@models/mainwindow/stats/game-stat';
import { Preferences } from '@models/preferences';
import { SessionWidgetGroupingType } from '@models/session/types';
import { isBattlegrounds, isBattlegroundsScene } from '@services/battlegrounds/bgs-utils';
import { CardsFacadeService } from '@services/cards-facade.service';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { GenericPreferencesUpdateEvent } from '@services/mainwindow/store/events/generic-preferences-update-event';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import { groupByFunction } from '@services/utils';
import { combineLatest, from, Observable } from 'rxjs';

@Component({
	selector: 'current-session-widget',
	styleUrls: [
		`../../../../css/themes/battlegrounds-theme.scss`,
		'../../../../css/component/overlays/session/current-session-widget.component.scss',
	],
	template: `
		<div class="current-session-widget battlegrounds-theme" *ngIf="showWidget$ | async">
			<div class="controls">
				<!-- <div class="mode">{{ currentDisplayedMode$ | async }}</div> -->
				<!-- <div class="display" [helpTooltip]="''">{{ currentGroupingLabel$ | async }}</div> -->
				<div
					class="title"
					[owTranslate]="'session.title'"
					[helpTooltip]="'session.title-tooltip' | owTranslate"
				></div>
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
				<div class="games" [helpTooltip]="gamesTooltip$ | async">{{ totalGamesLabel$ | async }}</div>
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
							<div class="value" [helpTooltip]="group.valueTooltip">{{ group.value }}</div>
							<ng-container [ngSwitch]="currentMode">
								<!-- BG details -->
								<div class="group-details" *ngSwitchCase="'battlegrounds'">
									<div class="background"></div>
									<div
										class="group-detail battlegrounds"
										*ngFor="let detail of group.details; trackBy: trackByDetailFn"
										componentTooltip
										[componentType]="componentType"
										[componentInput]="detail.boardEntities"
										componentTooltipPosition="auto"
									>
										<bgs-hero-portrait
											class="portrait"
											[heroCardId]="detail.cardId"
										></bgs-hero-portrait>
									</div>
								</div>
							</ng-container>
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
	componentType: ComponentType<any> = CurrentSessionBgsBoardTooltipComponent;

	showWidget$: Observable<boolean>;
	friendlyGameType$: Observable<'battlegrounds'>;
	currentDisplayedMode$: Observable<string>;
	currentGrouping$: Observable<SessionWidgetGroupingType>;
	currentGroupingLabel$: Observable<string>;
	totalGamesLabel$: Observable<string>;
	lastGame$: Observable<GameStat>;
	deltaRank$: Observable<number>;
	groups$: Observable<readonly Group[]>;
	gamesTooltip$: Observable<string>;

	currentMode = 'battlegrounds';

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
			.listenDeckState$((state) => state?.metadata?.gameType)
			.pipe(this.mapData(([gameType]) => gameType));
		this.friendlyGameType$ = currentGameType$.pipe(this.mapData((gameType) => this.toFriendlyGameType(gameType)));
		this.showWidget$ = combineLatest(
			currentGameType$,
			this.store.listen$(([main]) => main.currentScene),
		).pipe(
			this.mapData(([gameType, [currentScene]]) =>
				this.currentMode === 'battlegrounds'
					? isBattlegroundsScene(currentScene) || isBattlegrounds(gameType)
					: false,
			),
		);
		this.currentDisplayedMode$ = from(this.getDisplayModeKey(this.currentMode));
		this.currentGrouping$ = this.listenForBasicPref$((prefs) => prefs.sessionWidgetGrouping);
		this.currentGroupingLabel$ = this.currentGrouping$.pipe(
			this.mapData((grouping) => this.getGroupingKey(grouping)),
		);
		this.gamesTooltip$ = this.store
			.listenPrefs$((prefs) => prefs.currentSessionStartDate)
			.pipe(
				this.mapData(([currentSessionStartDate]) =>
					this.i18n.translateString('session.summary.total-games-tooltip', {
						value: currentSessionStartDate.toLocaleDateString(this.i18n.formatCurrentLocale(), {
							month: 'short',
							day: '2-digit',
							year: 'numeric',
						}),
					}),
				),
			);

		const lastGames$: Observable<readonly GameStat[]> = combineLatest(
			this.store.listenPrefs$((prefs) => prefs.currentSessionStartDate),
			this.store.listen$(([main, nav, prefs]) => main.stats.gameStats?.stats),
		).pipe(
			this.mapData(([[sessionStartDate], [stats]]) => {
				// Newest game first
				return stats
					.filter((stat) => this.gameModeFilter(stat, this.currentMode))
					.filter((stat) => !sessionStartDate || stat.creationTimestamp >= sessionStartDate.getTime());
			}),
		);
		this.totalGamesLabel$ = lastGames$.pipe(
			this.mapData((games) => {
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
				return this.buildBgsGroups(games);
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
		this.store.send(
			new GenericPreferencesUpdateEvent((prefs: Preferences) => ({
				...prefs,
				currentSessionStartDate: new Date(),
			})),
		);
	}

	close() {
		// TODO: only flip the flag of the current mode
		this.store.send(
			new GenericPreferencesUpdateEvent((prefs: Preferences) => ({
				...prefs,
				showCurrentSessionWidgetBgs: false,
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

	private getDisplayModeKey(gameType: string): string {
		switch (gameType) {
			case 'battlegrounds':
			default:
				return this.i18n.translateString('session.display-mode.battlegrounds');
			// return this.i18n.translateString('session.display-mode.unknown');
		}
	}

	private toFriendlyGameType(gameType: GameType): 'battlegrounds' | null {
		switch (gameType) {
			case GameType.GT_BATTLEGROUNDS:
			case GameType.GT_BATTLEGROUNDS_AI_VS_AI:
			case GameType.GT_BATTLEGROUNDS_FRIENDLY:
				return 'battlegrounds';
			default:
				return null;
		}
	}

	private gameModeFilter(stat: GameStat, gameType: string): boolean {
		switch (gameType) {
			case 'battlegrounds':
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
		const result = allPositions.map((position) => {
			const gamesForPosition = groupedByPosition[position] ?? [];
			return {
				category: `${position}`,
				categoryLabel: this.i18n.translateString(`session.groups.battlegrounds.category.${position}`),
				value: gamesForPosition.length,
				valueTooltip: this.i18n.translateString(`session.groups.battlegrounds.value-tooltip`),
				details: this.buildBgsDetails(gamesForPosition),
			};
		});
		return result;
	}

	private buildBgsDetails(gamesForPosition: readonly GameStat[]): readonly BgsDetail[] {
		return gamesForPosition.slice(0, 7).map((game: GameStat, index) => {
			const bgsBoard = !!game.postMatchStats?.boardHistory?.length
				? game.postMatchStats.boardHistory[game.postMatchStats.boardHistory.length - 1]
				: null;
			return {
				id: game.reviewId,
				cardId: game.playerCardId,
				tooltip: this.allCards.getCard(game.playerCardId).name,
				// boardEntities: bgsBoard?.board,
				boardEntities: bgsBoard?.board.map((value) => Entity.fromJS(value as any)),
			} as BgsDetail;
		});
	}
}

interface Group {
	readonly category: string;
	readonly categoryLabel: string;
	readonly value: number;
	readonly valueTooltip: string;
	readonly details: readonly Detail[];
}

interface Detail {
	readonly id: string;
	readonly cardId: string;
	readonly tooltip: string;
}

interface BgsDetail extends Detail {
	readonly boardEntities: readonly Entity[];
}
