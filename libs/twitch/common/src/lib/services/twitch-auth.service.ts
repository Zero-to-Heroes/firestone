/* eslint-disable no-mixed-spaces-and-tabs */
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { Entity } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { GameTag, SceneMode } from '@firestone-hs/reference-data';
import { BattlegroundsState, BgsBoard, BgsPlayer } from '@firestone/battlegrounds/core';
import { DeckCard, DeckState, GameEventType, GameState } from '@firestone/game-state';
import { MatchInfo, SceneService } from '@firestone/memory';
import {
	BugReportService,
	GameStatusService,
	Message,
	OwNotificationsService,
	Preferences,
	PreferencesService,
} from '@firestone/shared/common/service';
import { Mutable, NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { deflate, inflate } from 'pako';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { delay, distinctUntilChanged, filter, map, sampleTime, take } from 'rxjs/operators';
import { TwitchEvent } from '../model/ebs-event';
import { TwitchBgsBoard, TwitchBgsBoardEntity, TwitchBgsPlayer, TwitchBgsState } from '../model/twitch-bgs-state';

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

	private deckEvents = new BehaviorSubject<{ event: string; state: GameState } | null>(null);
	private bgEvents = new BehaviorSubject<BattlegroundsState | null>(null);
	private twitchAccessToken$: Observable<string>;
	private streamerPrefs$: Observable<Partial<Preferences>>;

	private twitchDelay = 0;

	private hasLoggedInfoOnce = false;
	private hasLoggedExpiredTokenInfoOnce = false;

	constructor(
		private readonly prefs: PreferencesService,
		private readonly http: HttpClient,
		private readonly notificationService: OwNotificationsService,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
		private readonly gameStatus: GameStatusService,
		private readonly scene: SceneService,
		private readonly bugReport: BugReportService,
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
			distinctUntilChanged(
				(a, b) =>
					a?.bgsHideSimResultsOnRecruit === b?.bgsHideSimResultsOnRecruit &&
					a?.bgsShowSimResultsOnlyOnRecruit === b?.bgsShowSimResultsOnlyOnRecruit,
			),
		);

		this.gameStatus.inGame$$
			.pipe(
				filter((inGame) => !!inGame),
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
						delay(this.twitchDelay),
					)
					.subscribe((event) => this.sendEvent(event));
			});
	}

	public async emitDeckEvent(event: any) {
		// console.debug('[twitch-auth] enqueueing deck event', event);
		if (['SCENE_CHANGED_MINDVISION' as GameEventType].includes(event.event.name)) {
			return;
		}
		this.deckEvents.next({ event: event.event.name, state: event.state });
	}

	public async emitBattlegroundsEvent(event: any) {
		// console.debug('[twitch-auth] enqueueing bg event', event);
		this.bgEvents.next(event);
	}

	private buildEvent(
		currentScene: SceneMode | null,
		deckEvent: { event: string; state: GameState } | null,
		bgsState: BattlegroundsState | null,
		twitchAccessToken: string,
		streamerPrefs: Partial<Preferences>,
	): TwitchEvent | null {
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
		const newBgsState: TwitchBgsState | null = !!bgsState
			? ({
					leaderboard: this.buildLeaderboard(bgsState),
					currentBattle: {
						battleInfo:
							latestBattle?.battleResult && latestBattle?.battleInfoStatus !== 'ongoing'
								? { ...latestBattle?.battleResult, outcomeSamples: undefined }
								: null,
						status:
							latestBattle?.battleInfoStatus === 'ongoing'
								? 'waiting-for-result'
								: latestBattle?.battleInfoStatus,
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
			  } as TwitchBgsState)
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
				hero: { ...deckState.hero },
			} as DeckState;
		}
		const result: Partial<NonFunctionProperties<DeckState>> = {
			secrets: deckState.secrets,
			deckstring: deckState.deckstring,
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
				(c) => ({ cardId: c.cardId, refManaCost: c.refManaCost } as DeckCard),
			) as readonly DeckCard[],
			sideboards: deckState.sideboards,
		};
		return result as DeckState;
	}

	private cleanZone(zone: readonly DeckCard[], isBattlegrounds: boolean): readonly DeckCard[] {
		return zone
			.map((card) => this.cleanCard(card, isBattlegrounds))
			.filter((card) => !!card) as readonly DeckCard[];
	}

	private cleanCard(card: DeckCard | null, isBattlegrounds: boolean): DeckCard | null {
		if (!card || card.zone === 'SETASIDE') {
			return null;
		}

		const newCard: Mutable<Partial<DeckCard>> = { ...card };
		if (isBattlegrounds) {
			delete newCard.creatorCardId;
			// delete newCard.zone;
			delete newCard.playTiming;
			delete newCard.stolenFromOpponent;
			delete newCard.refManaCost;
			delete newCard.actualManaCost;
			delete newCard.internalEntityId;
		}
		if (!newCard.linkedEntityIds?.length) {
			delete newCard.linkedEntityIds;
		}
		if (!newCard.relatedCardIds?.length) {
			delete newCard.relatedCardIds;
		}

		// Added again in the twitch extension upon receiving the message
		delete newCard.refManaCost;
		delete newCard.cardName;
		delete newCard.metaInfo;
		delete newCard.temporaryCard;
		delete newCard.dormant;
		delete newCard.rarity;
		delete newCard.playTiming;
		delete newCard.putIntoPlay;
		delete newCard.guessedInfo;
		delete newCard.storedInformation;
		delete newCard.tags;
		delete newCard.cardMatchCondition;

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

	private async sendEvent(newEvent: TwitchEvent | null) {
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
				if (data.statusCode === 422) {
					console.debug('ERROR', 'Twitch message too large', newEvent);
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
					this.bugReport.submitAutomatedReport({
						type: 'twitch-ebs-error',
						info: JSON.stringify({
							token: prefs.twitchAccessToken,
							error: error,
							event: newEvent,
						}),
					});
				} else {
					console.warn('[twitch-auth] Could not send deck event to EBS', JSON.stringify(error));
				}
				if (!this.hasLoggedExpiredTokenInfoOnce) {
					if (error?.error?.text?.toLowerCase()?.includes('invalid bearer')) {
						this.sendExpiredTwitchTokenNotification();
						this.hasLoggedExpiredTokenInfoOnce = true;
					}
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
			timeout: 90000,
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
					console.log('[twitch-auth] valid token', data);
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
		const valid = await this.validateToken(accessToken);
		console.log('[twitch-auth] saving access token', valid);
		await this.prefs.setTwitchAccessToken(accessToken);
		await this.retrieveUserName(accessToken);
	}
}
