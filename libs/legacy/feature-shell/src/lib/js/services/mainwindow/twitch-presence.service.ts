import { Injectable } from '@angular/core';
import { GameFormat, GameType } from '@firestone-hs/reference-data';
import { ApiRunner, OverwolfService } from '@firestone/shared/framework/core';
import { combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, startWith } from 'rxjs/operators';
import { ArenaInfo } from '../../models/arena-info';
import { Metadata } from '../../models/decktracker/metadata';
import { GameEvent } from '../../models/game-event';
import { MatchInfo } from '../../models/match-info';
import { DuelsInfo } from '../../models/memory/memory-duels';
import { MemoryMercenariesInfo } from '../../models/memory/memory-mercenaries-info';
import { BattleMercenary } from '../../models/mercenaries/mercenaries-battle-state';
import { Rank } from '../../models/player-info';
import { isBattlegrounds } from '../battlegrounds/bgs-utils';
import { DuelsStateBuilderService } from '../duels/duels-state-builder.service';
import { isDuels } from '../duels/duels-utils';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { isMercenaries } from '../mercenaries/mercenaries-utils';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { arraysEqual } from '../utils';

const UPDATE_URL = 'https://api.firestoneapp.com/twitch-presence';

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
		const arenaInfo$ = this.gameEvents.allEvents.asObservable().pipe(
			filter((event) => event.type === GameEvent.ARENA_INFO),
			map((event) => event.additionalData.arenaInfo as ArenaInfo),
			startWith(null),
		);
		const mercsInfo$ = this.gameEvents.allEvents.asObservable().pipe(
			filter((event) => event.type === GameEvent.MERCENARIES_INFO),
			map((event) => event.additionalData.mercsInfo as MemoryMercenariesInfo),
			startWith(null),
		);

		// "Normal" Hearthstone mode infos
		const hearthstoneInfo$ = combineLatest(
			this.store.listenDeckState$(
				(state) => state?.playerDeck?.hero?.cardId,
				(state) => state?.playerDeck?.hero?.playerClass,
				(state) => state?.opponentDeck?.hero?.cardId,
				(state) => state?.opponentDeck?.hero?.playerClass,
				(state) => state?.metadata,
				(state) => state?.gameStarted,
			),
			this.store.listenPrefs$((prefs) => prefs.appearOnLiveStreams),
		).pipe(
			debounceTime(200),
			filter(
				([
					[playerCardId, playerClass, opponentCardId, opponentClass, metadata, gameStarted],
					[appearOnLiveStreams],
				]) =>
					gameStarted &&
					appearOnLiveStreams &&
					!!metadata?.gameType &&
					!!metadata?.formatType &&
					!isBattlegrounds(metadata.gameType) &&
					!isMercenaries(metadata.gameType) &&
					!!playerClass &&
					!!opponentClass,
			),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			map(
				([
					[playerCardId, playerClass, opponentCardId, opponentClass, metadata, gameStarted],
					[appearOnLiveStreams],
				]) => ({
					playerCardId: playerCardId,
					playerClass: playerClass,
					opponentCardId: opponentCardId,
					opponentClass: opponentClass,
					metadata: metadata,
					gameStarted: gameStarted,
					appearOnLiveStreams: appearOnLiveStreams,
				}),
			),
		);

		combineLatest(hearthstoneInfo$, duelsInfo$, arenaInfo$, matchInfo$)
			.pipe(
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
			)
			.subscribe(([hearthstoneInfo, duelsInfo, arenaInfo, matchInfo]) => {
				const playerRank = buildRankInfo(hearthstoneInfo.metadata, duelsInfo, arenaInfo, matchInfo);
				this.sendNewGameEvent(
					playerRank,
					hearthstoneInfo.metadata,
					hearthstoneInfo.playerCardId,
					hearthstoneInfo.playerClass,
					hearthstoneInfo.opponentCardId,
					hearthstoneInfo.opponentClass,
				);
			});

		combineLatest(
			this.store.listenDeckState$((state) => state?.metadata),
			this.store.listenBattlegrounds$(
				([state]) => state.currentGame?.mmrAtStart,
				([state]) => state.currentGame?.gameEnded,
				([state]) => state.currentGame?.getMainPlayer()?.cardId,
			),
		)
			.pipe(
				debounceTime(200),
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
			)
			.subscribe(([[metadata], [mmrAtStart, gameEnded, playerCardId]]) => {
				this.sendNewBgsGameEvent(metadata, mmrAtStart, playerCardId);
			});

		combineLatest(
			this.store.listenMercenaries$(
				([state]) => state?.gameMode,
				([state]) => state?.playerTeam?.mercenaries,
			),
			mercsInfo$,
		)
			.pipe(
				debounceTime(500),
				filter(
					([[gameMode, mercenaries], mercsInfo]) =>
						!!gameMode &&
						!!mercenaries?.length &&
						(gameMode !== GameType.GT_MERCENARIES_PVP || !!mercsInfo?.PvpRating),
				),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
			)
			.subscribe(([[gameMode, mercenaries], mercsInfo]) => {
				this.sendNewMercsGameEvent(gameMode, mercenaries, mercsInfo?.PvpRating);
			});
		this.store
			.listenDeckState$(
				(state) => state.gameEnded,
				(state) => state?.gameStarted,
			)
			.pipe(
				debounceTime(200),
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
