import { Injectable } from '@angular/core';
import { CardClass, GameFormat, GameType } from '@firestone-hs/reference-data';
import { ArenaInfo, DuelsInfo, MatchInfo, MemoryMercenariesInfo, Rank } from '@firestone/memory';
import { ApiRunner, OverwolfService } from '@firestone/shared/framework/core';
import { combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, startWith } from 'rxjs/operators';
import { Metadata } from '../../models/decktracker/metadata';
import { GameEvent } from '../../models/game-event';
import { BattleMercenary } from '../../models/mercenaries/mercenaries-battle-state';
import { ArenaInfoService } from '../arena/arena-info.service';
import { isBattlegrounds } from '../battlegrounds/bgs-utils';
import { DuelsStateBuilderService } from '../duels/duels-state-builder.service';
import { isDuels } from '../duels/duels-utils';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { isMercenaries } from '../mercenaries/mercenaries-utils';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { arraysEqual, deepEqual } from '../utils';

const UPDATE_URL = 'https://7c53s3nacfjcv5yyqueduh3vxa0sycat.lambda-url.us-west-2.on.aws/';

@Injectable()
export class TwitchPresenceService {
	private twitchAccessToken: string;
	private twitchLoginName: string;

	constructor(
		private readonly store: AppUiStoreFacadeService,
		private readonly api: ApiRunner,
		private readonly ow: OverwolfService,
		private readonly gameEvents: GameEventsEmitterService,
		private readonly duelsState: DuelsStateBuilderService,
		private readonly arenaInfo: ArenaInfoService,
	) {
		this.init();
	}

	private async init() {
		await this.store.initComplete();

		const matchInfo$ = this.gameEvents.allEvents.asObservable().pipe(
			filter((event) => event.type === GameEvent.MATCH_INFO),
			map((event) => event.additionalData.matchInfo as MatchInfo),
			startWith(null),
		);
		const duelsInfo$ = this.duelsState.duelsInfo$$.asObservable();
		const arenaInfo$ = this.arenaInfo.arenaInfo$$;
		const mercsInfo$ = this.gameEvents.allEvents.asObservable().pipe(
			filter((event) => event.type === GameEvent.MERCENARIES_INFO),
			map((event) => event.additionalData.mercsInfo as MemoryMercenariesInfo),
			startWith(null),
		);

		// "Normal" Hearthstone mode infos
		const hearthstoneInfo$ = combineLatest([
			this.store.listenDeckState$(
				(state) => state?.playerDeck?.hero?.cardId,
				(state) => state?.playerDeck?.hero?.classes,
				(state) => state?.opponentDeck?.hero?.cardId,
				(state) => state?.opponentDeck?.hero?.classes,
				(state) => state?.metadata,
				(state) => state?.gameStarted,
			),
			this.store.listenPrefs$((prefs) => prefs.appearOnLiveStreams),
		]).pipe(
			debounceTime(1000),
			filter(
				([
					[playerCardId, playerClasses, opponentCardId, opponentClasses, metadata, gameStarted],
					[appearOnLiveStreams],
				]) =>
					gameStarted &&
					appearOnLiveStreams &&
					!!metadata?.gameType &&
					!!metadata?.formatType &&
					!isBattlegrounds(metadata.gameType) &&
					!isMercenaries(metadata.gameType) &&
					!!playerClasses?.length &&
					!!opponentClasses?.length,
			),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			map(
				([
					[playerCardId, playerClasses, opponentCardId, opponentClasses, metadata, gameStarted],
					[appearOnLiveStreams],
				]) => ({
					playerCardId: playerCardId,
					playerClass: playerClasses?.[0] ? CardClass[playerClasses[0]] : null,
					opponentCardId: opponentCardId,
					opponentClass: opponentClasses?.[0] ? CardClass[opponentClasses[0]] : null,
					metadata: metadata,
					gameStarted: gameStarted,
					appearOnLiveStreams: appearOnLiveStreams,
				}),
			),
		);

		combineLatest([hearthstoneInfo$, duelsInfo$, arenaInfo$, matchInfo$])
			.pipe(
				debounceTime(1000),
				filter(([hearthstoneInfo, duelsInfo, arenaInfo, matchInfo]) => {
					if (!hearthstoneInfo.gameStarted) {
						return false;
					}
					if (hearthstoneInfo.metadata.gameType === GameType.GT_RANKED) {
						return !!matchInfo;
					}
					if (hearthstoneInfo.metadata.gameType === GameType.GT_ARENA) {
						return !!arenaInfo;
					}
					if (isDuels(hearthstoneInfo.metadata.gameType)) {
						return !!duelsInfo;
					}
					return true;
				}),
				map(([hearthstoneInfo, duelsInfo, arenaInfo, matchInfo]) => {
					console.debug('[twitch-presence] sending new game event?', hearthstoneInfo, duelsInfo, arenaInfo);
					return {
						playerRank: buildRankInfo(hearthstoneInfo.metadata, duelsInfo, arenaInfo, matchInfo),
						metaData: hearthstoneInfo.metadata,
						playerCardId: hearthstoneInfo.playerCardId,
						playerClass: hearthstoneInfo.playerClass,
						opponentCardId: hearthstoneInfo.opponentCardId,
						opponentClass: hearthstoneInfo.opponentClass,
					};
				}),
				distinctUntilChanged(deepEqual),
			)
			.subscribe((event) => {
				this.sendNewGameEvent(
					event.playerRank,
					event.metaData,
					event.playerCardId,
					event.playerClass,
					event.opponentCardId,
					event.opponentClass,
				);
			});

		combineLatest([
			this.store.listenDeckState$((state) => state?.metadata),
			this.store.listenBattlegrounds$(
				([state]) => state.currentGame?.mmrAtStart,
				([state]) => state.currentGame?.gameEnded,
				([state]) => state.currentGame?.getMainPlayer()?.cardId,
			),
		])
			.pipe(
				debounceTime(1000),
				filter(
					([[metadata], [mmrAtStart, gameEnded, playerCardId]]) =>
						!!metadata?.gameType &&
						!!metadata?.formatType &&
						mmrAtStart != null &&
						!!playerCardId &&
						!gameEnded,
				),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				debounceTime(200),
				map(([[metadata], [mmrAtStart, gameEnded, playerCardId]]) => {
					return {
						metadata: metadata,
						mmrAtStart: mmrAtStart,
						gameEnded: gameEnded,
						playerCardId: playerCardId,
					};
				}),
				distinctUntilChanged(deepEqual),
			)
			.subscribe((event) => {
				this.sendNewBgsGameEvent(event.metadata, event.mmrAtStart, event.playerCardId);
			});

		combineLatest([
			this.store.listenMercenaries$(
				([state]) => state?.gameMode,
				([state]) => state?.playerTeam?.mercenaries,
			),
			mercsInfo$,
		])
			.pipe(
				debounceTime(1000),
				filter(
					([[gameMode, mercenaries], mercsInfo]) =>
						!!gameMode &&
						!!mercenaries?.length &&
						(gameMode !== GameType.GT_MERCENARIES_PVP || !!mercsInfo?.PvpRating),
				),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				map(([[gameMode, mercenaries], mercsInfo]) => {
					return {
						gameMode: gameMode,
						mercenaries: mercenaries,
						rating: mercsInfo?.PvpRating,
					};
				}),
				distinctUntilChanged(deepEqual),
			)
			.subscribe((event) => {
				this.sendNewMercsGameEvent(event.gameMode, event.mercenaries, event.PvpRating);
			});
		this.store
			.listenDeckState$(
				(state) => state.gameEnded,
				(state) => state?.gameStarted,
			)
			.pipe(
				debounceTime(1000),
				// distinctUntilChanged(),
			)
			.subscribe(([gameEnded, gameStarted]) => {
				// Because a clean state is created on game end
				if (gameEnded || !gameStarted) {
					this.sendEndGameEvent();
				}
			});

		this.store
			.listenPrefs$((prefs) => prefs.twitchAccessToken)
			.subscribe(([token]) => (this.twitchAccessToken = token));
		this.store.listenPrefs$((prefs) => prefs.twitchLoginName).subscribe(([info]) => (this.twitchLoginName = info));
	}

	private async sendNewGameEvent(
		playerRank: string,
		metadata: Metadata,
		playerCardId: string,
		playerClass: string,
		opponentCardId: string,
		opponentClass: string,
	) {
		if (!this.twitchAccessToken || !this.twitchLoginName) {
			return;
		}
		const currentUser = await this.ow.getCurrentUser();
		this.api.callPostApi(UPDATE_URL, {
			type: 'game-start',
			user: {
				userId: currentUser?.userId,
				userName: currentUser?.username,
				twitchUserName: this.twitchLoginName,
			},
			data: {
				playerRank: playerRank,
				playerCardId: playerCardId,
				playerClass: playerClass,
				opponentCardId: opponentCardId,
				opponentClass: opponentClass,
				metadata: metadata,
			},
		});
	}

	private async sendNewBgsGameEvent(metadata: Metadata, mmrAtStart: number, playerCardId: string) {
		if (!this.twitchAccessToken || !this.twitchLoginName) {
			return;
		}
		const currentUser = await this.ow.getCurrentUser();
		this.api.callPostApi(UPDATE_URL, {
			type: 'game-start-bgs',
			user: {
				userId: currentUser?.userId,
				userName: currentUser?.username,
				twitchUserName: this.twitchLoginName,
			},
			data: {
				mmrAtStart: mmrAtStart,
				playerCardId: playerCardId,
				metadata: metadata,
			},
		});
	}

	private async sendNewMercsGameEvent(
		gameMode: GameType,
		mercenaries: readonly BattleMercenary[],
		mmrAtStart: number,
	) {
		if (!this.twitchAccessToken || !this.twitchLoginName) {
			return;
		}
		const currentUser = await this.ow.getCurrentUser();
		this.api.callPostApi(UPDATE_URL, {
			type: 'game-start-mercs',
			user: {
				userId: currentUser?.userId,
				userName: currentUser?.username,
				twitchUserName: this.twitchLoginName,
			},
			data: {
				mmrAtStart: mmrAtStart,
				mercenaries: mercenaries.map((m) => m.cardId),
				metadata: {
					gameType: gameMode,
					formatType: GameFormat.FT_WILD,
					scenarioId: null,
				} as Metadata,
			},
		});
	}

	private async sendEndGameEvent() {
		if (!this.twitchAccessToken) {
			return;
		}
		const currentUser = await this.ow.getCurrentUser();
		this.api.callPostApi(UPDATE_URL, {
			type: 'game-end',
			user: {
				userId: currentUser?.userId,
				userName: currentUser?.username,
				twitchUserName: this.twitchLoginName,
			},
		});
	}
}

const buildRankInfo = (
	metadata: Metadata,
	duelsInfo: DuelsInfo,
	arenaInfo: ArenaInfo,
	matchInfo: MatchInfo,
): string => {
	switch (metadata?.gameType) {
		case GameType.GT_RANKED:
			return buildRankedRankInfo(metadata, matchInfo);
		case GameType.GT_PVPDR:
			return '' + duelsInfo.Rating;
		case GameType.GT_PVPDR_PAID:
			return '' + duelsInfo.PaidRating;
		case GameType.GT_ARENA:
			return `${arenaInfo.wins}-${arenaInfo.losses}`;
	}
};

const buildRankedRankInfo = (metadata: Metadata, matchInfo: MatchInfo): string => {
	switch (metadata.formatType) {
		case GameFormat.FT_WILD:
			return extractRankInfo(matchInfo?.localPlayer?.wild);
		case GameFormat.FT_CLASSIC:
			return extractRankInfo(matchInfo?.localPlayer?.classic);
		case GameFormat.FT_TWIST:
			return extractRankInfo(matchInfo?.localPlayer?.twist);
		default:
			return extractRankInfo(matchInfo?.localPlayer?.standard);
	}
};

const extractRankInfo = (rank: Rank): string => {
	if (!rank) {
		return null;
	}

	if (rank.legendRank > 0) {
		return `legend-${rank.legendRank}`;
	} else if (rank.leagueId >= 0 && rank.rankValue >= 0) {
		return `${rank.leagueId}-${rank.rankValue}`;
	}
	return null;
};
