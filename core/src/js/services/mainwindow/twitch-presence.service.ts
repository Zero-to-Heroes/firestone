import { Injectable } from '@angular/core';
import { GameFormat, GameType } from '@firestone-hs/reference-data';
import { combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, tap } from 'rxjs/operators';
import { Metadata } from '../../models/decktracker/metadata';
import { MatchInfo } from '../../models/match-info';
import { BattleMercenary } from '../../models/mercenaries/mercenaries-battle-state';
import { ApiRunner } from '../api-runner';
import { isBattlegrounds } from '../battlegrounds/bgs-utils';
import { isMercenaries } from '../mercenaries/mercenaries-utils';
import { OverwolfService } from '../overwolf.service';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { arraysEqual } from '../utils';

const UPDATE_URL = 'https://api.firestoneapp.com/twitch-presence';

@Injectable()
export class TwitchPresenceService {
	private twitchAccessToken: string;
	private twitchUserName: string;

	constructor(
		private readonly store: AppUiStoreFacadeService,
		private readonly api: ApiRunner,
		private readonly ow: OverwolfService,
	) {
		this.init();
	}

	private async init() {
		console.debug('[twitch-presence] store init starting');
		await this.store.initComplete();
		console.debug('[twitch-presence] store init complete');
		// Need to send an update when:
		// - game starts and player/opponent class is known and game type is known
		// - game ends
		// // - decklist is known
		// // - hero is selected (for BG)
		// TODO: add support for BG rating, as well as mercs stuff
		combineLatest(
			this.store.listenDeckState$(
				(state) => state?.matchInfo,
				(state) => state?.playerDeck?.hero?.cardId,
				(state) => state?.playerDeck?.hero?.playerClass,
				(state) => state?.opponentDeck?.hero?.cardId,
				(state) => state?.opponentDeck?.hero?.playerClass,
				(state) => state?.metadata,
				(state) => state?.gameStarted,
			),
		)
			.pipe(
				tap((info) => console.debug('[twitch-presence] game started?', info)),
				debounceTime(200),
				filter(
					([[matchInfo, playerCardId, playerClass, opponentCardId, opponentClass, metadata, gameStarted]]) =>
						!!playerClass && !!opponentClass && !!metadata?.gameType && !!metadata?.formatType,
				),
				tap((info) => console.debug('[twitch-presence] game started 2', info)),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				tap((info) => console.debug('[twitch-presence] game started 3', info)),
				debounceTime(200),
			)
			.subscribe(
				([[matchInfo, playerCardId, playerClass, opponentCardId, opponentClass, metadata, gameStarted]]) => {
					console.debug(
						'[twitch-presence] considering data to send',
						playerCardId,
						opponentCardId,
						metadata,
						gameStarted,
					);
					if (gameStarted && !isBattlegrounds(metadata.gameType) && !isMercenaries(metadata.gameType)) {
						this.sendNewGameEvent(
							matchInfo,
							metadata,
							playerCardId,
							playerClass,
							opponentCardId,
							opponentClass,
						);
					}
				},
			);
		combineLatest(
			this.store.listenDeckState$((state) => state?.metadata),
			this.store.listenBattlegrounds$(
				([state]) => state.currentGame?.mmrAtStart,
				([state]) => state.currentGame?.gameEnded,
				([state]) => state.currentGame?.getMainPlayer()?.cardId,
			),
		)
			.pipe(
				tap((info) => console.debug('[twitch-presence] bgs game started?', info)),
				debounceTime(200),
				filter(
					([[metadata], [mmrAtStart, gameEnded, playerCardId]]) =>
						!!metadata?.gameType &&
						!!metadata?.formatType &&
						mmrAtStart != null &&
						!!playerCardId &&
						!gameEnded,
				),
				tap((info) => console.debug('[twitch-presence] bgs game started 2', info)),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				tap((info) => console.debug('[twitch-presence] bgs game started 3', info)),
				debounceTime(200),
			)
			.subscribe(([[metadata], [mmrAtStart, gameEnded, playerCardId]]) => {
				console.debug('[twitch-presence] bgs considering data to send', playerCardId, mmrAtStart);
				this.sendNewBgsGameEvent(metadata, mmrAtStart, playerCardId);
			});
		// TODO: send the current rating
		combineLatest(
			this.store.listenMercenaries$(
				([state]) => state?.gameMode,
				([state]) => state?.playerTeam?.mercenaries,
			),
		)
			.pipe(
				tap((info) => console.debug('[twitch-presence] mercs game started?', info)),
				debounceTime(200),
				filter(([[gameMode, mercenaries]]) => !!gameMode && !!mercenaries?.length),
				tap((info) => console.debug('[twitch-presence] mercs game started 2', info)),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				tap((info) => console.debug('[twitch-presence] mercs game started 3', info)),
				debounceTime(200),
			)
			.subscribe(([[gameMode, mercenaries]]) => {
				console.debug('[twitch-presence] mercs considering data to send', mercenaries, gameMode);
				this.sendNewMercsGameEvent(gameMode, mercenaries);
			});
		this.store
			.listenDeckState$(
				(state) => state.gameEnded,
				(state) => state?.gameStarted,
			)
			.pipe(
				tap((info) => console.debug('[twitch-presence] game ended?', info)),
				debounceTime(200),
				// distinctUntilChanged(),
			)
			.subscribe(([gameEnded, gameStarted]) => {
				console.debug('[twitch-presence] considering game end to send', gameEnded);
				// Because a clean state is created on game end
				if (gameEnded || !gameStarted) {
					this.sendEndGameEvent();
				}
			});

		this.store
			.listenPrefs$((prefs) => prefs.twitchAccessToken)
			.subscribe(([token]) => (this.twitchAccessToken = token));
		this.store.listenPrefs$((prefs) => prefs.twitchUserName).subscribe(([info]) => (this.twitchUserName = info));
	}

	private async sendNewGameEvent(
		matchInfo: MatchInfo,
		metadata: Metadata,
		playerCardId: string,
		playerClass: string,
		opponentCardId: string,
		opponentClass: string,
	) {
		if (!this.twitchAccessToken || !this.twitchUserName) {
			console.debug('[twitch-presence] no twitch token', this.twitchAccessToken);
			return;
		}
		console.debug('[twitch-presence] will send new game event', metadata, playerCardId, opponentCardId);
		const currentUser = await this.ow.getCurrentUser();
		this.api.callPostApi(UPDATE_URL, {
			type: 'game-start',
			user: {
				userId: currentUser?.userId,
				userName: currentUser?.username,
				twitchUserName: this.twitchUserName,
			},
			data: {
				matchInfo: matchInfo,
				playerCardId: playerCardId,
				playerClass: playerClass,
				opponentCardId: opponentCardId,
				opponentClass: opponentClass,
				metadata: metadata,
			},
		});
	}

	private async sendNewBgsGameEvent(metadata: Metadata, mmrAtStart: number, playerCardId: string) {
		if (!this.twitchAccessToken || !this.twitchUserName) {
			console.debug('[twitch-presence] bgs no twitch token', this.twitchAccessToken);
			return;
		}
		console.debug('[twitch-presence] will send new bgs game event', mmrAtStart, playerCardId);
		const currentUser = await this.ow.getCurrentUser();
		this.api.callPostApi(UPDATE_URL, {
			type: 'game-start-bgs',
			user: {
				userId: currentUser?.userId,
				userName: currentUser?.username,
				twitchUserName: this.twitchUserName,
			},
			data: {
				mmrAtStart: mmrAtStart,
				playerCardId: playerCardId,
				metadata: metadata,
			},
		});
	}

	private async sendNewMercsGameEvent(gameMode: GameType, mercenaries: readonly BattleMercenary[]) {
		if (!this.twitchAccessToken || !this.twitchUserName) {
			console.debug('[twitch-presence] mercs no twitch token', this.twitchAccessToken);
			return;
		}
		console.debug('[twitch-presence] will send new mercs game event', gameMode, mercenaries);
		const currentUser = await this.ow.getCurrentUser();
		this.api.callPostApi(UPDATE_URL, {
			type: 'game-start-mercs',
			user: {
				userId: currentUser?.userId,
				userName: currentUser?.username,
				twitchUserName: this.twitchUserName,
			},
			data: {
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
			console.debug('[twitch-presence] no twitch token', this.twitchAccessToken);
			return;
		}
		console.debug('[twitch-presence] will send end game event');
		const currentUser = await this.ow.getCurrentUser();
		this.api.callPostApi(UPDATE_URL, {
			type: 'game-end',
			user: {
				userId: currentUser?.userId,
				userName: currentUser?.username,
				twitchUserName: this.twitchUserName,
			},
		});
	}
}
