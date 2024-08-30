import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { Entity } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { GameTag, SceneMode } from '@firestone-hs/reference-data';
import { BattlegroundsState, BgsBoard, BgsPlayer } from '@firestone/battlegrounds/common';
import { DeckCard, DeckState, GameState } from '@firestone/game-state';
import { MatchInfo, SceneService } from '@firestone/memory';
import {
	GameStatusService,
	Message,
	OwNotificationsService,
	Preferences,
	PreferencesService,
} from '@firestone/shared/common/service';
import { deepEqual } from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import {
	TwitchBgsBoard,
	TwitchBgsBoardEntity,
	TwitchBgsPlayer,
	TwitchBgsState,
	TwitchEvent,
} from '@firestone/twitch/common';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { deflate, inflate } from 'pako';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { delay, distinctUntilChanged, filter, map, sampleTime, take } from 'rxjs/operators';
import { GameEvent } from '../../models/game-event';

const CLIENT_ID = 'jbmhw349lqbus9j8tx4wac18nsja9u';
const REDIRECT_URI = 'https://www.firestoneapp.com/twitch-login.html';
const SCOPES = 'channel_read';
export const TWITCH_LOGIN_URL = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=${SCOPES}`;

const EBS_URL = 'https://ebs.firestoneapp.com/deck/event';
// const EBS_URL = 'https://localhost:8081/deck/event';

const TWITCH_VALIDATE_URL = 'https://id.twitch.tv/oauth2/validate';
const TWITCH_USER_URL = 'https://api.twitch.tv/helix/users';

// TODO translate
@Injectable()
export class TwitchAuthService {
	public stateUpdater = new EventEmitter<any>();

	private deckEvents = new BehaviorSubject<{ event: string; state: GameState }>(null);
	private bgEvents = new BehaviorSubject<BattlegroundsState>(null);
	private twitchAccessToken$: Observable<string>;
	private streamerPrefs$: Observable<Partial<Preferences>>;

	private twitchDelay = 0;

	constructor(
		private readonly prefs: PreferencesService,
		private readonly http: HttpClient,
		private readonly notificationService: OwNotificationsService,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly gameStatus: GameStatusService,
		private readonly scene: SceneService,
	) {
		this.init();
		window['deflate'] = (input, options) => {
			return deflate(input, options);
		};
		window['inflate'] = (input, options) => {
			return inflate(input, options);
		};
	}

	private async init() {
		await waitForReady(this.scene, this.prefs);

		this.stateUpdater.subscribe((twitchInfo: any) => {
			console.log('[twitch-auth] received access token', !!twitchInfo);
			this.saveAccessToken(twitchInfo.access_token);
		});

		this.prefs.preferences$$
			.pipe(
				map((prefs) => prefs.twitchDelay),
				distinctUntilChanged(),
			)
			.subscribe((delay) => (this.twitchDelay = delay));
		this.twitchAccessToken$ = this.prefs.preferences$$.pipe(
			map((prefs) => prefs.twitchAccessToken),
			distinctUntilChanged(),
		);
		this.streamerPrefs$ = this.prefs.preferences$$.pipe(
			map((prefs) => ({
				bgsHideSimResultsOnRecruit: prefs.bgsHideSimResultsOnRecruit,
				bgsShowSimResultsOnlyOnRecruit: prefs.bgsShowSimResultsOnlyOnRecruit,
			})),
			distinctUntilChanged((a, b) => deepEqual(a, b)),
		);

		this.gameStatus.inGame$$
			.pipe(
				filter((inGame) => inGame),
				take(1),
			)
			.subscribe(async () => {
				console.log('[twitch-auth] init');
				combineLatest([
					this.scene.currentScene$$,
					this.deckEvents,
					this.bgEvents,
					this.twitchAccessToken$,
					this.streamerPrefs$,
				])
					.pipe(
						sampleTime(2000),
						distinctUntilChanged(),
						map(([currentScene, deckEvent, bgsState, twitchAccessToken, streamerPrefs]) =>
							this.buildEvent(currentScene, deckEvent, bgsState, twitchAccessToken, streamerPrefs),
						),
						distinctUntilChanged((a, b) => deepEqual(a, b)),
						delay(this.twitchDelay),
					)
					.subscribe((event) => this.sendEvent(event));
			});
	}

	public async emitDeckEvent(event: any) {
		// console.debug('[twitch-auth] enqueueing deck event', event);
		if ([GameEvent.SCENE_CHANGED_MINDVISION].includes(event.event.name)) {
			return;
		}
		this.deckEvents.next({ event: event.event.name, state: event.state });
	}

	public async emitBattlegroundsEvent(event: any) {
		// console.debug('[twitch-auth] enqueueing bg event', event);
		this.bgEvents.next(event);
	}

	private buildEvent(
		currentScene: SceneMode,
		deckEvent: { event: string; state: GameState },
		bgsState: BattlegroundsState,
		twitchAccessToken: string,
		streamerPrefs: Partial<Preferences>,
	): TwitchEvent {
		if (!twitchAccessToken) {
			return null;
		}

		if (!deckEvent) {
			return null;
		}

		let playerDeck = this.cleanDeck(
			deckEvent.state.playerDeck,
			deckEvent.state.isBattlegrounds(),
			deckEvent.state.isMercenaries(),
		);
		const bgsPlayer = bgsState?.currentGame?.getMainPlayer();
		playerDeck = {
			...playerDeck,
			weapon: {
				...(playerDeck.weapon ?? {}),
				cardId: playerDeck.weapon?.cardId ?? bgsPlayer?.greaterTrinket ?? bgsPlayer?.lesserTrinket,
			} as DeckCard,
		} as DeckState;

		const bgsOpponent = bgsState?.currentGame?.players?.find(
			(player) => player.cardId === deckEvent.state.opponentDeck?.hero?.cardId,
		);
		let opponentDeck = this.cleanDeck(
			deckEvent.state.opponentDeck,
			deckEvent.state.isBattlegrounds(),
			deckEvent.state.isMercenaries(),
		);
		opponentDeck = {
			...opponentDeck,
			weapon: {
				...(opponentDeck.weapon ?? {}),
				cardId: opponentDeck.weapon?.cardId ?? bgsOpponent?.greaterTrinket ?? bgsOpponent?.lesserTrinket,
			} as DeckCard,
		} as DeckState;
		const newDeckState = GameState.create({
			playerDeck: playerDeck,
			opponentDeck: opponentDeck,
			mulliganOver: deckEvent.state.mulliganOver,
			metadata: deckEvent.state.metadata,
			currentTurn: deckEvent.state.currentTurn,
			gameStarted: deckEvent.state.gameStarted,
			gameEnded: deckEvent.state.gameEnded,
			cardsPlayedThisMatch: undefined,
			matchInfo: { anomalies: deckEvent.state.matchInfo?.anomalies } as MatchInfo,
		});

		// We need to show the last non-empty face off to let the extension decide whether to show the result
		// or not (e.g. based on the "show only on tavern" pref)
		const latestBattle = bgsState?.currentGame?.lastNonEmptyFaceOff();
		const newBgsState: TwitchBgsState = !!bgsState
			? {
					leaderboard: this.buildLeaderboard(bgsState),
					currentBattle: {
						battleInfo: latestBattle?.battleResult
							? { ...latestBattle?.battleResult, outcomeSamples: null }
							: null,
						status: latestBattle?.battleInfoStatus,
					},
					currentTurn: bgsState.currentGame?.currentTurn,
					inGame: bgsState.inGame,
					gameEnded: bgsState.currentGame?.gameEnded,
					availableRaces: bgsState.currentGame?.availableRaces,
					phase: bgsState.currentGame?.phase,
					config: {
						hasBuddies: bgsState.currentGame?.hasBuddies,
						hasPrizes: bgsState.currentGame?.hasPrizes,
						hasQuests: bgsState.currentGame?.hasQuests,
						hasSpells: bgsState.currentGame?.hasSpells,
						hasTrinkets: bgsState.currentGame?.hasTrinkets,
						anomalies: bgsState.currentGame?.anomalies,
					},
			  }
			: null;

		const result: TwitchEvent = {
			scene: currentScene,
			deck: newDeckState,
			bgs: newBgsState,
			streamerPrefs: streamerPrefs,
		};
		// console.debug('[twitch-auth] built event', result, bgsState);
		return result;
	}

	private cleanDeck(deckState: DeckState, isBattlegrounds: boolean, isMercenaries: boolean): DeckState {
		if (isBattlegrounds || isMercenaries) {
			// Just keep the quests and secrets
			const newOther = deckState.otherZone.filter((card) => card.zone === 'SECRET');
			return {
				hand: this.cleanZone(deckState.hand, isBattlegrounds),
				board: this.cleanZone(deckState.board, isBattlegrounds),
				otherZone: this.cleanZone(newOther, isBattlegrounds),
				heroPower: this.cleanCard(deckState.heroPower, isBattlegrounds),
				weapon: this.cleanCard(deckState.weapon, isBattlegrounds),
			} as DeckState;
		}
		const result = {
			// ...deckState,
			secrets: deckState.secrets,
			deckstring: deckState.deckstring,
			duelsStartingDeckstring: deckState.duelsStartingDeckstring,
			name: deckState.name,
			hero: deckState.hero,
			cardsLeftInDeck: deckState.cardsLeftInDeck,
			totalAttackOnBoard: deckState.totalAttackOnBoard,
			heroPower: this.cleanCard(deckState.heroPower, isBattlegrounds),
			weapon: this.cleanCard(deckState.weapon, isBattlegrounds),
			hand: this.cleanZone(deckState.hand, isBattlegrounds),
			board: this.cleanZone(deckState.board, isBattlegrounds),
			deck: this.cleanZone(deckState.deck, isBattlegrounds),
			otherZone: this.cleanZone(deckState.otherZone, isBattlegrounds),
			deckList: deckState.deckList?.map(
				(c) => ({ cardId: c.cardId, manaCost: c.manaCost } as DeckCard),
			) as readonly DeckCard[],
		};
		return result as DeckState;
	}

	private cleanZone(zone: readonly DeckCard[], isBattlegrounds: boolean): readonly DeckCard[] {
		return zone.map((card) => this.cleanCard(card, isBattlegrounds)).filter((card) => !!card);
	}

	private cleanCard(card: DeckCard, isBattlegrounds: boolean): DeckCard {
		if (!card || card.zone === 'SETASIDE') {
			return null;
		}

		const newCard = { ...card };
		if (isBattlegrounds) {
			delete newCard.creatorCardId;
			// delete newCard.zone;
			delete newCard.playTiming;
			delete newCard.stolenFromOpponent;
			delete newCard.manaCost;
			delete newCard.actualManaCost;
			delete newCard.internalEntityId;
		}
		if (!newCard.linkedEntityIds?.length) {
			delete newCard.linkedEntityIds;
		}
		if (!newCard.relatedCardIds?.length) {
			delete newCard.relatedCardIds;
		}

		delete newCard.cardName;
		delete newCard.metaInfo;
		delete newCard.temporaryCard;
		delete newCard.dormant;
		delete newCard.rarity;
		delete newCard.playTiming;
		delete newCard.putIntoPlay;

		this.removeFalsyProperties(newCard);

		return newCard as DeckCard;
	}

	private removeFalsyProperties(obj: { [key: string]: any }): void {
		for (const key in obj) {
			if (!obj[key]) {
				// Don't remove empty arrays, as the code isn't robust enough
				delete obj[key];
			}
		}
	}

	private hasLoggedInfoOnce = false;
	private async sendEvent(newEvent: TwitchEvent) {
		const prefs = await this.prefs.getPreferences();
		if (!newEvent) {
			return;
		}
		if (!prefs.twitchAccessToken) {
			return;
		}

		const httpHeaders: HttpHeaders = new HttpHeaders().set('Authorization', `Bearer ${prefs.twitchAccessToken}`);
		// console.debug('[twitch-auth] sending event', newEvent);
		this.http.post(EBS_URL, newEvent, { headers: httpHeaders }).subscribe(
			(data: any) => {
				// Do nothing
				if (!this.hasLoggedInfoOnce && data.statusCode === 422) {
					this.hasLoggedInfoOnce = true;
					console.log('no-format', '[twitch] message', data, JSON.stringify(newEvent), newEvent);
					console.debug(
						'[twitch] message debug',
						Buffer.byteLength(deflate(JSON.stringify(newEvent), { to: 'string' }), 'utf8'),
						Buffer.byteLength(deflate(JSON.stringify(newEvent)), 'utf8'),
						JSON.stringify(newEvent),
					);
					console.error(
						'no-format',
						'[twitch] Message sent to Twitch is too large',
						JSON.stringify(newEvent),
					);
				}
			},
			(error) => {
				if (!this.hasLoggedInfoOnce) {
					this.hasLoggedInfoOnce = true;
					console.error(
						'no-format',
						'[twitch-auth] Could not send deck event to EBS',
						error,
						JSON.stringify(newEvent),
						newEvent,
					);
				} else {
					console.warn('[twitch-auth] Could not send deck event to EBS', JSON.stringify(error));
				}
			},
		);
	}

	private buildLeaderboard(state: BattlegroundsState): readonly TwitchBgsPlayer[] {
		// Prevent info leak
		if (state.currentGame?.players?.length < 8) {
			return [];
		}
		return [...(state.currentGame?.players || [])]
			.sort((a, b) => a.leaderboardPlace - b.leaderboardPlace)
			.map((player) => this.buildLeaderboardPlayer(player));
	}

	private buildLeaderboardPlayer(player: BgsPlayer): TwitchBgsPlayer {
		return {
			cardId: player.getDisplayCardId(),
			heroPowerCardId: player.getDisplayHeroPowerCardId(this.allCards),
			name: player.name,
			isMainPlayer: player.isMainPlayer,
			initialHealth: player.initialHealth,
			damageTaken: player.damageTaken,
			leaderboardPlace: player.leaderboardPlace,
			lastBoard:
				player.boardHistory && player.boardHistory.length > 0
					? this.buildLastBoard(player.boardHistory[player.boardHistory.length - 1])
					: null,
			tripleHistory: player.tripleHistory,
			tavernUpgradeHistory: player.tavernUpgradeHistory,
			currentWinStreak: player.currentWinStreak,
			lastKnownComposition: player.getLastKnownComposition(),
			lastKnownBattleHistory: player.getLastKnownBattleHistory(),
			questRewards: player.questRewards,
			buddyTurns: player.buddyTurns,
			lesserTrinket: player.lesserTrinket,
			greaterTrinket: player.greaterTrinket,
		};
	}

	private buildLastBoard(lastKnownBoardState: BgsBoard): TwitchBgsBoard {
		return {
			turn: lastKnownBoardState.turn,
			board: lastKnownBoardState.board.map((entity) =>
				this.buildSerializableEntity(entity),
			) as readonly TwitchBgsBoardEntity[],
		};
	}

	private buildSerializableEntity(entity: Entity): TwitchBgsBoardEntity {
		return {
			id: entity.id,
			cardID: entity.cardID,
			tags: entity.tags.filter((value, key) => this.isSerializableTag(key)).toJS() as { [key: string]: number },
		};
	}

	private isSerializableTag(tag: string): boolean {
		const serializableTags = [
			GameTag.ATK,
			GameTag.CARDRACE,
			GameTag.CARDTYPE,
			GameTag.CLASS,
			GameTag.CONTROLLER,
			GameTag.COST,
			GameTag.DAMAGE,
			GameTag.DEATHRATTLE,
			GameTag.DIVINE_SHIELD,
			GameTag.ELITE,
			GameTag.ENTITY_ID,
			GameTag.EXHAUSTED,
			GameTag.HEALTH,
			GameTag.LIFESTEAL,
			GameTag.POISONOUS,
			GameTag.PREMIUM,
			GameTag.REBORN,
			GameTag.STEALTH,
			GameTag.TAG_SCRIPT_DATA_NUM_1,
			GameTag.TAG_SCRIPT_DATA_NUM_2,
			GameTag.TAUNT,
			GameTag.TECH_LEVEL,
			GameTag.VENOMOUS,
			GameTag.WINDFURY,
			GameTag.ZONE_POSITION,
		];
		// console.debug(
		// 	'is serializable?',
		// 	tag,
		// 	serializableTags,
		// 	serializableTags.map((tag) => GameTag[tag]),
		// 	serializableTags.map((tag) => GameTag[tag]).includes(tag),
		// );
		return serializableTags.map((tag) => GameTag[tag]).includes(tag);
	}

	public buildLoginUrl(): string {
		return TWITCH_LOGIN_URL;
	}

	public async sendExpiredTwitchTokenNotification() {
		console.log('[twitch-auth] Sending expired token notification');
		const title = this.i18n.translateString('twitch.could-not-log-error-title');
		const text = this.i18n.translateString('twitch.could-not-log-error-text');
		const content = `
			<div class="achievement-message-container">
				<div class="message">
					<div class="title">
						<span>${title}</span>
					</div>
					<div class="recap-text">
						<span>${text}</span>
					</div>
				</div>
				<button class="i-30 close-button">
					<svg class="svg-icon-fill">
						<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="assets/svg/sprite.svg#window-control_close"></use>
					</svg>
				</button>
			</div>`;
		this.notificationService.emitNewNotification({
			notificationId: 'expired-token-notif-' + new Date().getTime(),
			content: content,
			type: 'expired-token-notif',
		} as Message);
	}

	public async isLoggedIn(): Promise<boolean> {
		const prefs = await this.prefs.getPreferences();
		// Never added an access token
		if (!prefs.twitchAccessToken) {
			return false;
		}
		// Handle expired tokens?
		const isTokenValid = await this.validateToken(prefs.twitchAccessToken);
		return isTokenValid;
	}

	// TODO: refactor this so that this service becomes a single source of truth for the token
	// and only exposes a valid token?
	public async validateToken(accessToken: string): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			const httpHeaders: HttpHeaders = new HttpHeaders().set('Authorization', `OAuth ${accessToken}`);
			this.http.get(TWITCH_VALIDATE_URL, { headers: httpHeaders }).subscribe(
				(data: any) => {
					console.log('[twitch-auth] validating token', data);
					// this.twitchUserId = data.user_id;
					resolve(true);
				},
				() => {
					console.log('[twitch-auth] invalid token', accessToken);
					resolve(false);
				},
			);
		});
	}

	private async retrieveUserName(accessToken: string): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			const httpHeaders: HttpHeaders = new HttpHeaders()
				.set('Authorization', `Bearer ${accessToken}`)
				.set('Client-Id', 'jbmhw349lqbus9j8tx4wac18nsja9u');
			this.http.get(`${TWITCH_USER_URL}`, { headers: httpHeaders }).subscribe(
				(data: any) => {
					console.log('[twitch-auth] received user info', data.data[0].display_name);
					if (!!data?.data?.length) {
						this.prefs.setTwitchUserName(data.data[0].display_name, data.data[0].login);
					}
				},
				(error) => {
					console.log('[twitch-auth] could not retrieve user info', error);
					resolve(false);
				},
			);
		});
	}

	private async saveAccessToken(accessToken: string) {
		await this.validateToken(accessToken);
		await this.prefs.setTwitchAccessToken(accessToken);
		await this.retrieveUserName(accessToken);
	}
}
