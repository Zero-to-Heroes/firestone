import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { Entity } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { debounceTime, delay, distinctUntilChanged, map } from 'rxjs/operators';
import {
	TwitchBgsBoard,
	TwitchBgsBoardEntity,
	TwitchBgsPlayer,
	TwitchBgsState,
} from '../../components/decktracker/overlay/twitch/twitch-bgs-state';
import { BattlegroundsState } from '../../models/battlegrounds/battlegrounds-state';
import { BgsPlayer } from '../../models/battlegrounds/bgs-player';
import { BgsBoard } from '../../models/battlegrounds/in-game/bgs-board';
import { DeckCard } from '../../models/decktracker/deck-card';
import { DeckState } from '../../models/decktracker/deck-state';
import { GameState } from '../../models/decktracker/game-state';
import { GameEvent } from '../../models/game-event';
import { Message, OwNotificationsService } from '../notifications.service';
import { PreferencesService } from '../preferences.service';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { areDeepEqual } from '../utils';

const EBS_URL = 'https://ebs.firestoneapp.com/deck/event';
// const EBS_URL = 'https://localhost:8081/deck/event';

const CLIENT_ID = 'jbmhw349lqbus9j8tx4wac18nsja9u';
const REDIRECT_URI = 'https://www.firestoneapp.com/twitch-login.html';
const SCOPES = 'channel_read';
const LOGIN_URL = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=${SCOPES}`;
const TWITCH_VALIDATE_URL = 'https://id.twitch.tv/oauth2/validate';
const TWITCH_USER_URL = 'https://api.twitch.tv/helix/users';

// TODO translate
@Injectable()
export class TwitchAuthService {
	public stateUpdater = new EventEmitter<any>();

	private deckEvents = new BehaviorSubject<{ event: string; state: GameState }>(null);
	private bgEvents = new BehaviorSubject<BattlegroundsState>(null);
	private twitchAccessToken$: Observable<string>;

	private twitchDelay = 0;

	constructor(
		private readonly prefs: PreferencesService,
		private readonly http: HttpClient,
		private readonly notificationService: OwNotificationsService,
		private readonly store: AppUiStoreFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
	) {
		this.init();
	}

	private async init() {
		this.stateUpdater.subscribe((twitchInfo: any) => {
			console.log('[twitch-auth] received access token', !!twitchInfo);
			this.saveAccessToken(twitchInfo.access_token);
		});

		await this.store.initComplete();

		this.store.listenPrefs$((prefs) => prefs.twitchDelay).subscribe(([delay]) => (this.twitchDelay = delay));
		this.twitchAccessToken$ = this.store
			.listenPrefs$((prefs) => prefs.twitchAccessToken)
			.pipe(
				map(([pref]) => pref),
				distinctUntilChanged(),
			);
		combineLatest(this.deckEvents, this.bgEvents, this.twitchAccessToken$)
			.pipe(
				debounceTime(500),
				distinctUntilChanged(),
				map(([deckEvent, bgsState, twitchAccessToken]) =>
					this.buildEvent(deckEvent, bgsState, twitchAccessToken),
				),
				distinctUntilChanged((a, b) => areDeepEqual(a, b)),
				delay(this.twitchDelay),
			)
			.subscribe((event) => this.sendEvent(event));
		console.log('[twitch-auth] init done');
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
		deckEvent: { event: string; state: GameState },
		bgsState: BattlegroundsState,
		twitchAccessToken: string,
	): TwitchEvent {
		if (!twitchAccessToken) {
			return null;
		}

		if (!deckEvent) {
			return null;
		}

		const newDeckState = GameState.create({
			playerDeck: this.cleanDeck(
				deckEvent.state.playerDeck,
				deckEvent.state.isBattlegrounds(),
				deckEvent.state.isMercenaries(),
			),
			opponentDeck: this.cleanDeck(
				deckEvent.state.opponentDeck,
				deckEvent.state.isBattlegrounds(),
				deckEvent.state.isMercenaries(),
			),
			mulliganOver: deckEvent.state.mulliganOver,
			metadata: deckEvent.state.metadata,
			currentTurn: deckEvent.state.currentTurn,
			gameStarted: deckEvent.state.gameStarted,
			gameEnded: deckEvent.state.gameEnded,
			cardsPlayedThisMatch: undefined,
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
			  }
			: null;

		const result = {
			deck: newDeckState,
			bgs: newBgsState,
		};
		// console.debug('[twitch-auth] built event', result, bgsState);
		return result;
	}

	private cleanDeck(deckState: DeckState, isBattlegrounds: boolean, isMercenaries: boolean): DeckState {
		if (isBattlegrounds || isMercenaries) {
			return {
				hand: this.cleanZone(deckState.hand, isBattlegrounds),
				board: this.cleanZone(deckState.board, isBattlegrounds),
				heroPower: this.cleanCard(deckState.heroPower, isBattlegrounds),
			} as DeckState;
		}
		const result = {
			...deckState,
			hand: this.cleanZone(deckState.hand, isBattlegrounds),
			board: this.cleanZone(deckState.board, isBattlegrounds),
			deck: this.cleanZone(deckState.deck, isBattlegrounds),
			otherZone: this.cleanZone(deckState.otherZone, isBattlegrounds),
			deckList: this.cleanZone(deckState.deckList, isBattlegrounds),
		};
		delete result.secrets;
		delete result.spellsPlayedThisMatch;
		delete result.dynamicZones;
		delete result.cardsPlayedThisTurn;
		delete result.cardsPlayedFromInitialDeck;
		delete result.cardsPlayedThisMatch;
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
		delete newCard.cardName;
		delete newCard.metaInfo;
		delete newCard.temporaryCard;
		delete newCard.dormant;
		if (isBattlegrounds) {
			delete newCard.creatorCardId;
			delete newCard.zone;
			delete newCard.playTiming;
			delete newCard.zone;
		}
		return newCard as DeckCard;
	}

	private hasLoggedInfoOnce = false;
	private async sendEvent(newEvent: TwitchEvent) {
		const prefs = await this.prefs.getPreferences();
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
					console.error('[twitch-auth] Could not send deck event to EBS', error);
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
			// buddyTurns: player.buddyTurns,
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
			tags: entity.tags.filter((value, key) => this.isSerializableTag(key)).toJS(),
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
			GameTag.MEGA_WINDFURY,
			GameTag.POISONOUS,
			GameTag.PREMIUM,
			GameTag.REBORN,
			GameTag.TAG_SCRIPT_DATA_NUM_1,
			GameTag.TAG_SCRIPT_DATA_NUM_2,
			GameTag.TAUNT,
			GameTag.TECH_LEVEL,
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
		return LOGIN_URL;
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
					console.log('[twitch-auth] received user info', data);
					this.prefs.setTwitchUserName(data.data && data.data.length > 0 && data.data[0].display_name);
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

export interface TwitchEvent {
	readonly deck: GameState;
	readonly bgs: TwitchBgsState;
}
