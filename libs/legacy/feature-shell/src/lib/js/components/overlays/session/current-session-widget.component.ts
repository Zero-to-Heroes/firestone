import { ComponentType } from '@angular/cdk/portal';
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { CurrentSessionBgsBoardTooltipComponent } from '@components/overlays/session/current-session-bgs-board-tooltip.component';
import {
	KnownBoard,
	buildFinalWarband,
	buildMatchResultText,
} from '@components/replays/replay-info/replay-info-battlegrounds.component';
import { GameType, getReferenceTribeCardId, getTribeIcon, getTribeName } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { SceneService } from '@firestone/memory';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { isBattlegrounds, isBattlegroundsScene, normalizeHeroCardId } from '@services/battlegrounds/bgs-utils';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { GenericPreferencesUpdateEvent } from '@services/mainwindow/store/events/generic-preferences-update-event';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import { groupByFunction } from '@services/utils';
import { Observable, combineLatest, from } from 'rxjs';

@Component({
	selector: 'current-session-widget',
	styleUrls: [
		`../../../../css/themes/battlegrounds-theme.scss`,
		'../../../../css/component/overlays/session/current-session-widget.component.scss',
	],
	template: `
		<div class="current-session-widget battlegrounds-theme scalable">
			<ng-container *ngIf="showWidget$ | async">
				<ng-container *ngIf="{ opacity: opacity$ | async } as value">
					<div class="background" [style.opacity]="value.opacity"></div>
					<div class="controls">
						<!-- <div class="mode">{{ currentDisplayedMode$ | async }}</div> -->
						<!-- <div class="display" [helpTooltip]="''">{{ currentGroupingLabel$ | async }}</div> -->
						<div
							class="title"
							[owTranslate]="'session.title'"
							[helpTooltip]="'session.title-tooltip' | owTranslate"
						></div>
						<div class="buttons">
							<control-settings
								[settingsApp]="'battlegrounds'"
								[settingsSection]="'session'"
							></control-settings>
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
								<!-- {{ value2.currentPlayerRank }} -->
								<rank-image
									*ngIf="lastGame$ | async as lastGame"
									class="player-rank"
									[stat]="lastGame"
									[gameMode]="lastGame.gameMode"
									[rankTooltip]="'session.summary.mmr-tooltip' | owTranslate"
								></rank-image>
							</div>
							<ng-container *ngIf="deltaRank$ | async as deltaRank">
								<div
									class="delta"
									*ngIf="deltaRank != null"
									[ngClass]="{
										positive: deltaRank > 0,
										negative: deltaRank < 0
									}"
									[helpTooltip]="'session.summary.delta-mmr-tooltip' | owTranslate"
								>
									{{ deltaRank }}
								</div>
							</ng-container>
						</div>
					</div>
					<div class="content">
						<div class="grouped" *ngIf="showGroups$ | async">
							<div class="group" *ngFor="let group of groups$ | async; trackBy: trackByGroupFn">
								<div class="category">{{ group.categoryLabel }}</div>
								<div class="value" [helpTooltip]="group.valueTooltip">{{ group.value }}</div>
								<ng-container [ngSwitch]="currentMode">
									<!-- BG details -->
									<!-- When other modes are supported, extract this to specific components -->
									<div class="group-details" *ngSwitchCase="'battlegrounds'">
										<div class="background" [style.opacity]="value.opacity"></div>
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
						<ng-container *ngIf="{ showMatches: showMatches$ | async, matches: matches$ | async } as value">
							<div class="details" *ngIf="value.showMatches && value.matches?.length">
								<div class="detail" *ngFor="let match of value.matches; trackBy: trackByMatchFn">
									<div class="hero-portrait">
										<img
											class="player-class player"
											[src]="match.heroPortraitImage"
											[helpTooltip]="match.heroPortraitTooltip"
										/>
									</div>
									<div class="hero-name">{{ match.heroName }}</div>
									<div class="position">{{ match.placement }}</div>
									<div
										class="delta-mmr"
										[ngClass]="{
											positive: match.deltaMmr > 0,
											negative: match.deltaMmr < 0
										}"
									>
										{{ match.deltaMmr }}
									</div>
									<div class="anomalies">
										<div class="tribe" *ngFor="let tribe of match.anomalies">
											<img class="icon" [src]="tribe.icon" />
										</div>
									</div>
									<div class="tribes">
										<div class="tribe" *ngFor="let tribe of match.availableTribes">
											<img class="icon" [src]="tribe.icon" />
										</div>
									</div>
									<div class="board" *ngIf="match?.finalWarband?.entities?.length">
										<bgs-board
											[entities]="match.finalWarband.entities"
											[customTitle]="null"
											[minionStats]="match.finalWarband.minionStats"
											[finalBoard]="true"
											[useFullWidth]="true"
											[hideDamageHeader]="true"
											[debug]="false"
										></bgs-board>
									</div>
									<!-- <replay-info [replay]="match" [displayTime]="false"></replay-info> -->
								</div>
							</div>
						</ng-container>
					</div>
				</ng-container>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrentSessionWidgetComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	componentType: ComponentType<any> = CurrentSessionBgsBoardTooltipComponent;

	showWidget$: Observable<boolean>;
	friendlyGameType$: Observable<'battlegrounds' | 'battlegrounds-friendly'>;
	currentDisplayedMode$: Observable<string>;
	showGroups$: Observable<boolean>;
	showMatches$: Observable<boolean>;
	currentPlayerRank$: Observable<string>;
	// currentGrouping$: Observable<SessionWidgetGroupingType>;
	// currentGroupingLabel$: Observable<string>;
	totalGamesLabel$: Observable<string>;
	deltaRank$: Observable<number>;
	groups$: Observable<readonly Group[]>;
	matches$: Observable<readonly SessionMatch[]>;
	gamesTooltip$: Observable<string>;
	opacity$: Observable<number>;

	lastGame$: Observable<GameStat>;

	currentMode = 'battlegrounds';

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly scene: SceneService,
		private readonly prefs: PreferencesService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.prefs);

		const currentGameType$ = this.store
			.listenDeckState$((state) => state?.metadata?.gameType)
			.pipe(this.mapData(([gameType]) => gameType));
		this.friendlyGameType$ = currentGameType$.pipe(this.mapData((gameType) => this.toFriendlyGameType(gameType)));
		this.showWidget$ = combineLatest([currentGameType$, this.scene.currentScene$$]).pipe(
			this.mapData(([gameType, currentScene]) =>
				this.currentMode === 'battlegrounds'
					? isBattlegroundsScene(currentScene) || isBattlegrounds(gameType)
					: false,
			),
		);
		this.currentDisplayedMode$ = from(this.getDisplayModeKey(this.currentMode));
		this.showGroups$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.sessionWidgetShowGroup));
		this.showMatches$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.sessionWidgetShowMatches));
		this.opacity$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => Math.max(0.01, prefs.sessionWidgetOpacity / 100)),
		);
		this.gamesTooltip$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.currentSessionStartDate),
			this.mapData((currentSessionStartDate) =>
				currentSessionStartDate
					? this.i18n.translateString('session.summary.total-games-tooltip', {
							value: currentSessionStartDate.toLocaleDateString(this.i18n.formatCurrentLocale(), {
								month: 'short',
								day: '2-digit',
								year: 'numeric',
							}),
					  })
					: this.i18n.translateString('session.summary.total-games-tooltip-all-time'),
			),
		);

		const lastModeGames$ = this.store
			.gameStats$()
			.pipe(this.mapData((stats) => stats?.filter((stat) => this.gameModeFilter(stat, this.currentMode))));
		const lastGames$: Observable<readonly GameStat[]> = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.currentSessionStartDate)),
			lastModeGames$,
		]).pipe(
			this.mapData(([sessionStartDate, stats]) => {
				// Newest game first
				return (
					stats?.filter(
						(stat) => !sessionStartDate || stat.creationTimestamp >= sessionStartDate.getTime(),
					) ?? []
				);
			}),
		);
		this.totalGamesLabel$ = lastGames$.pipe(
			this.mapData((games) => {
				return this.i18n.translateString('session.summary.total-games', { value: games.length });
			}),
		);
		// So that a rank is displayed even though we have just reset the session widget
		this.lastGame$ = combineLatest(lastGames$, lastModeGames$).pipe(
			this.mapData(([games, gamesForMode]) => {
				const lastGame = games?.[0] ?? gamesForMode?.[0];
				return !!lastGame ? lastGame.update({ playerRank: lastGame.newPlayerRank }) : null;
			}),
		);
		this.deltaRank$ = combineLatest([lastGames$, currentGameType$]).pipe(
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
		this.matches$ = combineLatest([
			lastGames$,
			currentGameType$,
			this.listenForBasicPref$((prefs) => prefs.sessionWidgetNumberOfMatchesToShow),
		]).pipe(
			this.mapData(([games, currentGameType, sessionWidgetNumberOfMatchesToShow]) => {
				return this.buildBgsMatches(games, sessionWidgetNumberOfMatchesToShow);
			}),
		);
		this.store
			.listen$(([main, nav, prefs]) => prefs.sessionWidgetScale)
			.pipe(this.mapData(([pref]) => pref))
			.subscribe((scale) => {
				const element = this.el.nativeElement.querySelector('.scalable');
				if (element) {
					this.renderer.setStyle(element, 'transform', `scale(${scale / 100})`);
				}
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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

	trackByMatchFn(index: number, item: SessionMatch) {
		return item.reviewId;
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

	private getDisplayModeKey(gameType: string): string {
		switch (gameType) {
			case 'battlegrounds':
			case 'battlegrounds-friendly':
			default:
				return this.i18n.translateString('session.display-mode.battlegrounds');
			// return this.i18n.translateString('session.display-mode.unknown');
		}
	}

	private toFriendlyGameType(gameType: GameType): 'battlegrounds' | 'battlegrounds-friendly' | null {
		switch (gameType) {
			case GameType.GT_BATTLEGROUNDS:
				return 'battlegrounds';
			case GameType.GT_BATTLEGROUNDS_AI_VS_AI:
			case GameType.GT_BATTLEGROUNDS_FRIENDLY:
			case GameType.GT_BATTLEGROUNDS_PLAYER_VS_AI:
				return 'battlegrounds-friendly';
			default:
				return null;
		}
	}

	private gameModeFilter(stat: GameStat, gameType: string): boolean {
		switch (gameType) {
			case 'battlegrounds':
			case 'battlegrounds-friendly':
				return stat.gameMode === 'battlegrounds' || stat.gameMode === 'battlegrounds-friendly';
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

	private buildBgsMatches(
		games: readonly GameStat[],
		sessionWidgetNumberOfMatchesToShow: number,
	): readonly SessionMatch[] {
		const gamesWithFinalPosition = games.filter(
			(game) => game.additionalResult && !isNaN(parseInt(game.additionalResult)),
		);
		return gamesWithFinalPosition
			.map((match) => this.toSessionMatch(match))
			.slice(0, sessionWidgetNumberOfMatchesToShow);
	}

	private toSessionMatch(info: GameStat): SessionMatch {
		const heroCard = this.allCards.getCard(info.playerCardId);
		const normalizedCardId = normalizeHeroCardId(heroCard.id, this.allCards);
		return {
			reviewId: info.reviewId,
			heroName: this.allCards.getCard(normalizedCardId).name,
			heroPortraitImage: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${normalizedCardId}.jpg`,
			heroPortraitTooltip: heroCard.name,
			placement: buildMatchResultText(info, this.i18n),
			deltaMmr: parseInt(info.newPlayerRank) - parseInt(info.playerRank),
			anomalies: [...(info.bgsAnomalies ?? [])]
				.filter((a) => !!a?.length)
				.sort()
				.map((anomaly) => ({
					cardId: anomaly,
					icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${anomaly}.jpg`,
					tooltip: this.allCards.getCard(anomaly).name,
				})),
			availableTribes: [...(info.bgsAvailableTribes ?? [])]
				.sort((a, b) => a - b)
				.map((race) => ({
					cardId: getReferenceTribeCardId(race),
					icon: getTribeIcon(race),
					tooltip: getTribeName(race, this.i18n),
				})),
			finalWarband: buildFinalWarband(info, this.allCards),
		};
	}

	private buildBgsDetails(gamesForPosition: readonly GameStat[]): readonly BgsDetail[] {
		return gamesForPosition.slice(0, 7).map((game: GameStat, index) => {
			const bgsBoard = !!game.postMatchStats?.boardHistory?.length
				? game.postMatchStats.boardHistory[game.postMatchStats.boardHistory.length - 1]
				: null;
			return {
				id: game.reviewId,
				cardId: normalizeHeroCardId(game.playerCardId, this.allCards),
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
	readonly details: readonly BgsDetail[];
}

interface Detail {
	readonly id: string;
	readonly cardId: string;
	readonly tooltip: string;
}

interface BgsDetail extends Detail {
	readonly boardEntities: readonly Entity[];
}

interface SessionMatch {
	readonly reviewId: string;
	readonly heroPortraitImage: string;
	readonly heroPortraitTooltip: string;
	readonly heroName: string;
	readonly placement: string;
	readonly deltaMmr: number;
	readonly anomalies: readonly InternalTribe[];
	readonly availableTribes: readonly InternalTribe[];
	readonly finalWarband: KnownBoard;
}

interface InternalTribe {
	readonly cardId: string;
	readonly icon: string;
	readonly tooltip: string;
}
