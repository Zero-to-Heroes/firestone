import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { Entity } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { GameTag, GameType } from '@firestone-hs/reference-data';
import { OutcomeSamples } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import { deflate } from 'pako';
import {
	TwitchBgsBoard,
	TwitchBgsBoardEntity,
	TwitchBgsCurrentBattle,
	TwitchBgsPlayer,
	TwitchBgsState,
} from '../../components/decktracker/overlay/twitch/twitch-bgs-state';
import { BattlegroundsState } from '../../models/battlegrounds/battlegrounds-state';
import { BgsPlayer } from '../../models/battlegrounds/bgs-player';
import { BgsBoard } from '../../models/battlegrounds/in-game/bgs-board';
import { DeckCard } from '../../models/decktracker/deck-card';
import { DeckState } from '../../models/decktracker/deck-state';
import { GameState } from '../../models/decktracker/game-state';
import { Message, OwNotificationsService } from '../notifications.service';
import { PreferencesService } from '../preferences.service';
import { ProcessingQueue } from '../processing-queue.service';

const EBS_URL = 'https://ebs.firestoneapp.com/deck/event';
// const EBS_URL = 'https://localhost:8081/deck/event';

const CLIENT_ID = 'jbmhw349lqbus9j8tx4wac18nsja9u';
const REDIRECT_URI = 'overwolf-extension://lnknbakkpommmjjdnelmfbjjdbocfpnpbkijjnob/Files/twitch-auth-callback.html';
const SCOPES = 'channel_read';
const LOGIN_URL = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=${SCOPES}`;
const TWITCH_VALIDATE_URL = 'https://id.twitch.tv/oauth2/validate';
const TWITCH_USER_URL = 'https://api.twitch.tv/helix/users';

const MAX_TWITCH_MESSAGE_SIZE = 4500;

@Injectable()
export class TwitchAuthService {
	public stateUpdater = new EventEmitter<any>();

	private processingQueue = new ProcessingQueue<any>(
		(eventQueue) => this.processQueue(eventQueue),
		1000,
		'twitch-emitter',
	);
	private bgsProcessingQueue = new ProcessingQueue<any>(
		(eventQueue) => this.processBgsQueue(eventQueue),
		1000,
		'twitch-bgs-emitter',
	);

	private lastProcessTimestamp = 0;
	private lastProcessBgsTimestamp = 0;

	constructor(
		private prefs: PreferencesService,
		private http: HttpClient,
		private notificationService: OwNotificationsService,
	) {
		window['twitchAuthUpdater'] = this.stateUpdater;

		this.stateUpdater.subscribe((twitchInfo: any) => {
			console.log('[twitch-auth] received access token', twitchInfo);
			this.saveAccessToken(twitchInfo.access_token);
		});
		console.log('[twitch-auth] handler init done');
	}

	public async emitDeckEvent(event: any) {
		this.processingQueue.enqueue(event);
	}

	public async emitBattlegroundsEvent(event: any) {
		this.bgsProcessingQueue.enqueue(event);
	}

	private async processQueue(eventQueue: readonly any[]): Promise<readonly any[]> {
		// Debounce events
		if (Date.now() - this.lastProcessTimestamp < 4000) {
			return eventQueue;
		}
		this.lastProcessTimestamp = Date.now();
		const mostRecentEvent = eventQueue[eventQueue.length - 1];
		await this.emitEvent(mostRecentEvent);
		return [];
	}

	private async processBgsQueue(eventQueue: readonly any[]): Promise<readonly any[]> {
		// Debounce events
		if (Date.now() - this.lastProcessBgsTimestamp < 4000) {
			return eventQueue;
		}
		this.lastProcessBgsTimestamp = Date.now();
		const mostRecentEvent = eventQueue[eventQueue.length - 1];
		await this.emitBgsEvent(mostRecentEvent);
		return [];
	}

	private async emitEvent(event: any) {
		// return;
		let newEvent = Object.assign(
			{
				type: 'deck-event',
			},
			event,
		);
		if (!newEvent.state) {
			newEvent = Object.assign({}, newEvent, {
				state: GameState.create(),
			});
		}

		// TODO: clean this to only send the relevant info
		const newState = Object.assign(new GameState(), {
			playerDeck: newEvent.state.playerDeck,
			opponentDeck: newEvent.state.opponentDeck,
			mulliganOver: newEvent.state.mulliganOver,
			metadata: newEvent.state.metadata,
			currentTurn: newEvent.state.currentTurn,
			gameStarted: newEvent.state.gameStarted,
			gameEnded: newEvent.state.gameEnded,
		} as GameState);

		newEvent = Object.assign({}, newEvent, {
			state: newState,
		});

		// Tmp fix until we fix the twitch extension
		if (!newEvent.state.playerDeck.deckList || newEvent.state.playerDeck.deckList.length === 0) {
			const newDeck: readonly DeckCard[] = [
				...newEvent.state.playerDeck.deck,
				...newEvent.state.playerDeck.hand,
				...newEvent.state.playerDeck.otherZone,
			].sort((a, b) => a.manaCost - b.manaCost);
			const newPlayerDeck = Object.assign(new DeckState(), newEvent.state.playerDeck, {
				deck: newDeck,
			} as DeckState);
			const newState = Object.assign(new GameState(), newEvent.state, {
				playerDeck: newPlayerDeck,
			} as GameState);
			newEvent = Object.assign({}, newEvent, {
				state: newState,
			});
			// console.log('fixed event to send', newEvent, event);
		}
		if (
			newEvent.state &&
			(newEvent.state.metadata.gameType === GameType.GT_BATTLEGROUNDS ||
				newEvent.state.metadata.gameType === GameType.GT_BATTLEGROUNDS_FRIENDLY)
		) {
			// Don't show anything in the deck itself
			const newState = Object.assign(new GameState(), newEvent.state, {
				playerDeck: null,
				opponentDeck: null,
				deckStats: null,
			} as GameState);
			newEvent = Object.assign({}, newEvent, {
				state: newState,
			});
		}
		this.sendEvent(newEvent);
	}

	private async emitBgsEvent(state: BattlegroundsState) {
		// console.log('ready to emit twitch event', newEvent);
		const prefs = await this.prefs.getPreferences();
		if (!prefs.twitchAccessToken) {
			// console.log('no twitch access token, returning');
			return;
		}
		const stateToSend: TwitchBgsState = {
			leaderboard: this.buildLeaderboard(state),
			// TODO: remove this once everything is properly deployed on Twitch
			// currentBattle: {
			// 	battleInfo: state.currentGame?.battleResult,
			// 	status: state.currentGame?.battleInfoStatus,
			// },
			currentTurn: state.currentGame?.currentTurn,
			inGame: state.inGame,
			gameEnded: state.currentGame?.gameEnded,
		};

		// For now remove this, as it's clearly not optimized and can cause some CPU issues
		const shouldSplitMessage = false; // this.shouldSplitMessage(stateToSend);
		if (!shouldSplitMessage) {
			this.sendEvent({
				type: 'bgs',
				state: stateToSend,
			});
		} else {
			const { currentBattle, ...newEvent } = stateToSend;

			const bgsStateEvent = {
				type: 'bgs',
				state: newEvent,
			};
			this.sendEvent(bgsStateEvent);

			// console.warn('battle message too big, considering splitting it');
			const cleanedCurrentBattle = this.cleanCurrentBattle(currentBattle);
			if (!cleanedCurrentBattle) {
				console.warn('Could not compress message enough');
				return;
			}
			const bgsBattleEvent = {
				event: {
					// Here for backward compatibility purpose
					name: 'bgs-battle',
				},
				type: 'bgs-battle',
				state: cleanedCurrentBattle,
			};
			// console.log('[twitch] splitting message', bgsStateEvent, bgsBattleEvent);

			this.sendEvent(bgsBattleEvent);
		}
	}

	private cleanCurrentBattle(currentBattle: TwitchBgsCurrentBattle, threshold = 15): TwitchBgsCurrentBattle {
		let shouldSplit = true;
		while (threshold && threshold > 0 && shouldSplit) {
			currentBattle = this.cleanOutcome(currentBattle, threshold, [
				{
					selector: (battle: TwitchBgsCurrentBattle) => battle.battleInfo.lostPercent,
					cleaner: (outcomeSamples: OutcomeSamples) => ({
						...outcomeSamples,
						lost: undefined,
					}),
				} as Cleaner,
				{
					selector: (battle: TwitchBgsCurrentBattle) => battle.battleInfo.tiedPercent,
					cleaner: (outcomeSamples: OutcomeSamples) => ({
						...outcomeSamples,
						tied: undefined,
					}),
				} as Cleaner,
				{
					selector: (battle: TwitchBgsCurrentBattle) => battle.battleInfo.wonPercent,
					cleaner: (outcomeSamples: OutcomeSamples) => ({
						...outcomeSamples,
						won: undefined,
					}),
				} as Cleaner,
			]);
			threshold = threshold - 3;
			if (threshold > 0) {
				shouldSplit = this.shouldSplitMessage(currentBattle);
			}
			if (shouldSplit) {
				// console.warn(
				// 	'[twitch] battle message still too big, considering further cleaning',
				// 	new Blob([deflate(JSON.stringify(currentBattle), { to: 'string' })]).size,
				// 	JSON.stringify(currentBattle).length,
				// 	currentBattle,
				// 	threshold,
				// );
			} else {
				// console.log('[twitch] message compressed', currentBattle);
			}
		}
		return currentBattle;
	}

	private cleanOutcome(
		battle: TwitchBgsCurrentBattle,
		threshold: number,
		cleaners: readonly Cleaner[],
	): TwitchBgsCurrentBattle {
		for (const cleaner of cleaners) {
			if (cleaner.selector(battle) >= threshold) {
				// console.log('[twitch] deleting uninteresting sample', threshold, cleaner.selector(battle));
				battle = {
					...battle,
					battleInfo: {
						...battle.battleInfo,
						outcomeSamples: cleaner.cleaner(battle.battleInfo.outcomeSamples),
					},
				};
				// console.log('deleted', battle);
			}
		}
		// console.log('returning after deletion', battle);
		return battle;
	}

	private shouldSplitMessage(message: any) {
		const compressedMessage = deflate(JSON.stringify(message), { to: 'string' });
		const messageSize = new Blob([compressedMessage]).size;
		return messageSize >= MAX_TWITCH_MESSAGE_SIZE;
	}

	private hasLoggedInfoOnce = false;
	private async sendEvent(newEvent) {
		// return;
		// console.log('ready to emit twitch event', newEvent);
		const prefs = await this.prefs.getPreferences();
		if (!prefs.twitchAccessToken) {
			// console.log('no twitch access token, returning');
			return;
		}
		// console.log('sending twitch event', newEvent);
		const httpHeaders: HttpHeaders = new HttpHeaders().set('Authorization', `Bearer ${prefs.twitchAccessToken}`);
		this.http.post(EBS_URL, newEvent, { headers: httpHeaders }).subscribe(
			(data: any) => {
				// Do nothing
				if (!this.hasLoggedInfoOnce && data.statusCode === 422) {
					// 	const compressedMessage = deflate(JSON.stringify(newEvent), { to: 'string' });
					// 	this.hasLoggedInfoOnce = true;
					console.error('no-format', '[twitch] Message sent to Twitch is too large');
				}
			},
			(error) => {
				// if (!this.hasLoggedInfoOnce) {
				// 	const compressedMessage = deflate(JSON.stringify(newEvent), { to: 'string' });
				// 	const noFormat = !this.hasLoggedInfoOnce ? 'no-format' : '';
				// 	this.hasLoggedInfoOnce = true;
				console.error('[twitch-auth] Could not send deck event to EBS', error);
				// }
			},
		);
	}

	private buildLeaderboard(state: BattlegroundsState): readonly TwitchBgsPlayer[] {
		return [...(state.currentGame?.players || [])]
			.sort((a, b) => a.leaderboardPlace - b.leaderboardPlace)
			.map((player) => this.buildLeaderboardPlayer(player));
	}

	private buildLeaderboardPlayer(player: BgsPlayer): TwitchBgsPlayer {
		return {
			cardId: player.getDisplayCardId(),
			heroPowerCardId: player.getDisplayHeroPowerCardId(),
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
			tags: entity.tags.filter((tag) => this.isSerializableTag(tag)).toJS(),
		};
	}

	private isSerializableTag(tag): boolean {
		return true;
		// Will activate that later on, when message size becomes an issue once more
		const isSerializable = [
			GameTag.PREMIUM,
			GameTag.DAMAGE,
			GameTag.HEALTH,
			GameTag.ATK,
			GameTag.COST,
			GameTag.WINDFURY,
			GameTag.TAUNT,
			GameTag.DIVINE_SHIELD,
			GameTag.CLASS,
			GameTag.CARDTYPE,
			GameTag.CARDRACE,
			GameTag.DEATHRATTLE,
			GameTag.ZONE_POSITION,
			GameTag.POISONOUS,
			GameTag.LIFESTEAL,
			GameTag.REBORN,
			GameTag.MEGA_WINDFURY,
			GameTag.TECH_LEVEL,
			GameTag.TECH_LEVEL_MANA_GEM,
		].includes(tag);
		console.log(
			'is tag serializable',
			tag,
			isSerializable,
			'is taunt?',
			GameTag.TAUNT,
			tag === GameTag.TAUNT,
			[
				GameTag.PREMIUM,
				GameTag.DAMAGE,
				GameTag.HEALTH,
				GameTag.ATK,
				GameTag.COST,
				GameTag.WINDFURY,
				GameTag.TAUNT,
				GameTag.DIVINE_SHIELD,
				GameTag.CLASS,
				GameTag.CARDTYPE,
				GameTag.CARDRACE,
				GameTag.DEATHRATTLE,
				GameTag.ZONE_POSITION,
				GameTag.POISONOUS,
				GameTag.LIFESTEAL,
				GameTag.REBORN,
				GameTag.MEGA_WINDFURY,
				GameTag.TECH_LEVEL,
				GameTag.TECH_LEVEL_MANA_GEM,
			].indexOf(tag),
		);
		return isSerializable;
	}

	public buildLoginUrl(): string {
		return LOGIN_URL;
	}

	public async sendExpiredTwitchTokenNotification() {
		console.log('[twitch-auth] Sending expired token notification');
		const content = `
			<div class="achievement-message-container">
				<div class="message">
					<div class="title">
						<span>We couldn't log you into your Twitch account</span>
					</div>
					<div class="recap-text">
						<span>Please go to the settings and reconnect to your Twitch account</span>
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
				(data) => {
					console.log('[twitch-auth] validating token', data);
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
			const httpHeaders: HttpHeaders = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
			this.http.get(TWITCH_USER_URL, { headers: httpHeaders }).subscribe(
				(data: any) => {
					console.log('[twitch-auth] received user info', data);
					this.prefs.setTwitchUserName(data.data && data.data.length > 0 && data.data[0].display_name);
				},
				() => {
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

interface Cleaner {
	selector: (battle: TwitchBgsCurrentBattle) => number;
	cleaner: (outcomeSamples: OutcomeSamples) => OutcomeSamples;
}
