import { EventEmitter, Injectable } from '@angular/core';
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BehaviorSubject } from 'rxjs';
import { AttackOnBoard } from '../../models/decktracker/attack-on-board';
import { BoardSecret } from '../../models/decktracker/board-secret';
import { DeckState } from '../../models/decktracker/deck-state';
import { GameState } from '../../models/decktracker/game-state';
import { GameEvent } from '../../models/game-event';
import { Preferences } from '../../models/preferences';
import { Events } from '../events.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { TwitchAuthService } from '../mainwindow/twitch-auth.service';
import { ManastormInfo } from '../manastorm-bridge/manastorm-info';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';
import { ProcessingQueue } from '../processing-queue.service';
import { AiDeckService } from './ai-deck-service.service';
import { DeckCardService } from './deck-card.service';
import { DeckParserService } from './deck-parser.service';
import { DynamicZoneHelperService } from './dynamic-zone-helper.service';
import { AssignCardIdParser } from './event-parser/assign-card-ids-parser';
import { BurnedCardParser } from './event-parser/burned-card-parser';
import { CardBackToDeckParser } from './event-parser/card-back-to-deck-parser';
import { CardBuffedInHandParser } from './event-parser/card-buffed-in-hand-parser';
import { CardChangedInDeckParser } from './event-parser/card-changed-in-deck-parser';
import { CardChangedInHandParser } from './event-parser/card-changed-in-hand-parser';
import { CardChangedOnBoardParser } from './event-parser/card-changed-on-board-parser';
import { CardCreatorChangedParser } from './event-parser/card-creator-changed-parser';
import { CardDrawParser } from './event-parser/card-draw-parser';
import { CardOnBoardAtGameStart } from './event-parser/card-on-board-at-game-start-parser';
import { CardPlayedFromHandParser } from './event-parser/card-played-from-hand-parser';
import { CardRecruitedParser } from './event-parser/card-recruited-parser';
import { CardRemovedFromBoardParser } from './event-parser/card-removed-from-board-parser';
import { CardRemovedFromDeckParser } from './event-parser/card-removed-from-deck-parser';
import { CardRemovedFromHandParser } from './event-parser/card-removed-from-hand-parser';
import { CardRevealedParser } from './event-parser/card-revealed-parser';
import { CardStolenParser } from './event-parser/card-stolen-parser';
import { CreateCardInDeckParser } from './event-parser/create-card-in-deck-parser';
import { CthunParser } from './event-parser/cthun-parser';
import { DamageTakenParser } from './event-parser/damage-taken-parser';
import { DeckManipulationHelper } from './event-parser/deck-manipulation-helper';
import { DecklistUpdateParser } from './event-parser/decklist-update-parser';
import { DeckstringOverrideParser } from './event-parser/deckstring-override-parser';
import { DiscardedCardParser } from './event-parser/discarded-card-parser';
import { EndOfEchoInHandParser } from './event-parser/end-of-echo-in-hand-parser';
import { EntityUpdateParser } from './event-parser/entity-update-parser';
import { EventParser } from './event-parser/event-parser';
import { FatigueParser } from './event-parser/fatigue-parser';
import { FirstPlayerParser } from './event-parser/first-player-parser';
import { GalakrondInvokedParser } from './event-parser/galakrond-invoked-parser';
import { GameEndParser } from './event-parser/game-end-parser';
import { GameRunningParser } from './event-parser/game-running-parser';
import { GameStartParser } from './event-parser/game-start-parser';
import { HeroPowerChangedParser } from './event-parser/hero-power-changed-parser';
import { JadeGolemParser } from './event-parser/jade-golem-parser';
import { LocalPlayerParser } from './event-parser/local-player-parser';
import { MainStepReadyParser } from './event-parser/main-step-ready-parser';
import { MatchMetadataParser } from './event-parser/match-metadata-parser';
import { MinionBackOnBoardParser } from './event-parser/minion-back-on-board-parser';
import { MinionDiedParser } from './event-parser/minion-died-parser';
import { MinionGoDormantParser } from './event-parser/minion-go-dormant-parser';
import { MinionOnBoardAttackUpdatedParser } from './event-parser/minion-on-board-attack-updated-parser';
import { MinionSummonedFromHandParser } from './event-parser/minion-summoned-from-hand-parser';
import { MinionSummonedParser } from './event-parser/minion-summoned-parser';
import { MulliganOverParser } from './event-parser/mulligan-over-parser';
import { NewTurnParser } from './event-parser/new-turn-parser';
import { OpponentPlayerParser } from './event-parser/opponent-player-parser';
import { PassiveTriggeredParser } from './event-parser/passive-triggered-parser';
import { PogoPlayedParser } from './event-parser/pogo-played-parser';
import { QuestCreatedInGameParser } from './event-parser/quest-created-in-game-parser';
import { QuestDestroyedParser } from './event-parser/quest-destroyed-parser';
import { QuestPlayedFromDeckParser } from './event-parser/quest-played-from-deck-parser';
import { QuestPlayedFromHandParser } from './event-parser/quest-played-from-hand-parser';
import { ReceiveCardInHandParser } from './event-parser/receive-card-in-hand-parser';
import { SecretCreatedInGameParser } from './event-parser/secret-created-in-game-parser';
import { SecretDestroyedParser } from './event-parser/secret-destroyed-parser';
import { SecretPlayedFromDeckParser } from './event-parser/secret-played-from-deck-parser';
import { SecretPlayedFromHandParser } from './event-parser/secret-played-from-hand-parser';
import { SecretTriggeredParser } from './event-parser/secret-triggered-parser';
import { SecretsParserService } from './event-parser/secrets/secrets-parser.service';
import { WeaponDestroyedParser } from './event-parser/weapon-destroyed-parser';
import { WeaponEquippedParser } from './event-parser/weapon-equipped-parser';
import { GameStateMetaInfoService } from './game-state-meta-info.service';
import { AttackOpponentCounterOverlayHandler } from './overlays/counter-opponent-attack-handler';
import { CthunOpponentCounterOverlayHandler } from './overlays/counter-opponent-cthun-handler';
import { FatigueOpponentCounterOverlayHandler } from './overlays/counter-opponent-fatigue-handler';
import { GalakroundOpponentCounterOverlayHandler } from './overlays/counter-opponent-galakrond-handler';
import { JadeGolemOpponentCounterOverlayHandler } from './overlays/counter-opponent-jade-golem-handler';
import { PogoOpponentCounterOverlayHandler } from './overlays/counter-opponent-pogo-handler';
import { AttackPlayerCounterOverlayHandler } from './overlays/counter-player-attack-handler';
import { CthunPlayerCounterOverlayHandler } from './overlays/counter-player-cthun-handler';
import { FatiguePlayerCounterOverlayHandler } from './overlays/counter-player-fatigue-handler';
import { GalakroundPlayerCounterOverlayHandler } from './overlays/counter-player-galakrond-handler';
import { JadeGolemPlayerCounterOverlayHandler } from './overlays/counter-player-jade-golem-handler';
import { PogoPlayerCounterOverlayHandler } from './overlays/counter-player-pogo-handler';
import { OpponentDeckOverlayHandler } from './overlays/opponent-deck-overlay-handler';
import { OpponentHandOverlayHandler } from './overlays/opponent-hand-overlay-handler';
import { OverlayHandler } from './overlays/overlay-handler';
import { PlayerDeckOverlayHandler } from './overlays/player-deck-overlay-handler';
import { SecretsHelperOverlayHandler } from './overlays/secrets-helper-overlay-handler';
import { SecretConfigService } from './secret-config.service';
import { ZoneOrderingService } from './zone-ordering.service';

@Injectable()
export class GameStateService {
	public state: GameState = new GameState();
	private eventParsers: readonly EventParser[];

	private processingQueue = new ProcessingQueue<GameEvent>(
		eventQueue => this.processQueue(eventQueue),
		50,
		'game-state',
	);

	// We need to get through a queue to avoid race conditions when two events are close together,
	// so that we're sure teh state is update sequentially
	// private eventQueue: Queue<GameEvent> = new Queue<GameEvent>();
	private deckEventBus = new BehaviorSubject<any>(null);
	private deckUpdater: EventEmitter<GameEvent> = new EventEmitter<GameEvent>();
	private eventEmitters = [];
	private overlayHandlers: OverlayHandler[] = [];

	private currentReviewId: string;

	private showDecktrackerFromGameMode: boolean;
	private onGameScreen: boolean;

	constructor(
		private gameEvents: GameEventsEmitterService,
		private events: Events,
		private dynamicZoneHelper: DynamicZoneHelperService,
		private gameStateMetaInfos: GameStateMetaInfoService,
		private zoneOrdering: ZoneOrderingService,
		private allCards: AllCardsService,
		private prefs: PreferencesService,
		private twitch: TwitchAuthService,
		private deckCardService: DeckCardService,
		private ow: OverwolfService,
		private deckParser: DeckParserService,
		private helper: DeckManipulationHelper,
		private aiDecks: AiDeckService,
		private secretsConfig: SecretConfigService,
		private secretsParser: SecretsParserService,
	) {
		this.eventParsers = this.buildEventParsers();
		this.registerGameEvents();
		this.buildEventEmitters();
		this.buildOverlayHandlers();
		if (!this.ow) {
			console.warn('[game-state] Could not find OW service');
			return;
		}
		const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
		preferencesEventBus.subscribe(async event => {
			if (event.name === PreferencesService.TWITCH_CONNECTION_STATUS) {
				console.log('rebuilding event emitters');
				this.buildEventEmitters();
				return;
			}
		});
		this.deckUpdater.subscribe((event: GameEvent) => {
			this.processingQueue.enqueue(event);
		});
		window['deckEventBus'] = this.deckEventBus;
		window['deckUpdater'] = this.deckUpdater;
		// window['deckDebug'] = this;
		window['logGameState'] = () => {
			console.log(JSON.stringify(this.state));
		};
		setTimeout(() => {
			const decktrackerDisplayEventBus: BehaviorSubject<boolean> = this.ow.getMainWindow()
				.decktrackerDisplayEventBus;
			decktrackerDisplayEventBus.subscribe(event => {
				if (this.showDecktrackerFromGameMode === event) {
					return;
				}
				console.log('decktracker display update', event);
				this.showDecktrackerFromGameMode = event;
				console.log('will update overlays', event, this.showDecktrackerFromGameMode);
				this.updateOverlays(this.state, false, false);
			});
		});
		this.handleDisplayPreferences();
		setTimeout(() => {
			const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
			preferencesEventBus.subscribe(event => {
				if (event) {
					this.handleDisplayPreferences(event.preferences);
				}
			});
		});
		this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (this.ow.exitGame(res) || !(await this.ow.inGame())) {
				this.ow.closeWindow(OverwolfService.DECKTRACKER_WINDOW);
				this.ow.closeWindow(OverwolfService.DECKTRACKER_OPPONENT_WINDOW);
				this.ow.closeWindow(OverwolfService.MATCH_OVERLAY_OPPONENT_HAND_WINDOW);
			}
			if (await this.ow.inGame()) {
				this.updateOverlays(this.state);
			}
		});
	}

	public async getCurrentReviewId(): Promise<string> {
		return new Promise<string>(resolve => this.getCurrentReviewIdInternal(reviewId => resolve(reviewId)));
	}

	private async getCurrentReviewIdInternal(callback, retriesLeft = 15) {
		if (retriesLeft <= 0) {
			console.error('[game-state] Could not get current review id');
			callback(null);
			return;
		}
		if (!this.currentReviewId) {
			setTimeout(() => this.getCurrentReviewIdInternal(callback, retriesLeft - 1), 2000);
			return;
		}
		callback(this.currentReviewId);
	}

	private registerGameEvents() {
		this.gameEvents.onGameStart.subscribe(event => {
			console.log('[game-state] game start event received, resetting currentReviewId');
			this.currentReviewId = undefined;
		});
		this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => {
			this.processingQueue.enqueue(gameEvent);
		});
		this.events.on(Events.REVIEW_FINALIZED).subscribe(async event => {
			console.log('[game-state] Received review finalized event, doing nothing');
		});
		this.events.on(Events.REVIEW_INITIALIZED).subscribe(async event => {
			console.log('[game-state] Received new review id event');
			const info: ManastormInfo = event.data[0];
			if (info && info.type === 'new-empty-review') {
				this.currentReviewId = info.reviewId;
			}
		});
		// Reset the deck if it exists
		//console.log('[game-state] Enqueueing default game_end event');
		this.processingQueue.enqueue(Object.assign(new GameEvent(), { type: GameEvent.GAME_END } as GameEvent));
	}

	private async processQueue(eventQueue: readonly GameEvent[]) {
		// const gameEvent = eventQueue[0];
		try {
			const stateUpdateEvents = eventQueue.filter(event => event.type === GameEvent.GAME_STATE_UPDATE);
			const eventsToProcess = [
				...eventQueue.filter(event => event.type !== GameEvent.GAME_STATE_UPDATE),
				stateUpdateEvents.length > 0 ? stateUpdateEvents[stateUpdateEvents.length - 1] : null,
			].filter(event => event);
			// console.log('will processed', eventsToProcess.length, 'events');
			for (let i = 0; i < eventsToProcess.length; i++) {
				await this.processEvent(eventsToProcess[i], i === eventsToProcess.length - 1);
			}
		} catch (e) {
			console.error('Exception while processing event', e);
		}
		return [];
	}

	private previousStart: number = Date.now();

	private async processEvent(gameEvent: GameEvent, shouldUpdateOverlays = true) {
		const allowRequeue = !(gameEvent as any).preventRequeue;
		//console.log('processing event', gameEvent.type, allowRequeue, gameEvent);
		this.overlayHandlers.forEach(handler =>
			handler.processEvent(gameEvent, this.state, this.showDecktrackerFromGameMode),
		);

		if (gameEvent.type === 'TOGGLE_SECRET_HELPER') {
			// console.log('[game-state] handling overlay for event', gameEvent.type);
			this.state = this.state.update({
				opponentDeck: this.state.opponentDeck.update({
					secretHelperActive: !this.state.opponentDeck.secretHelperActive,
				} as DeckState),
			} as GameState);
			this.updateOverlays(this.state, false, false, shouldUpdateOverlays);
		} else if (gameEvent.type === 'TOGGLE_SECRET_HELPER_HOVER_ON') {
		} else if (gameEvent.type === 'TOGGLE_SECRET_HELPER_HOVER_OFF') {
		} else if (gameEvent.type === GameEvent.GAME_START) {
			this.updateOverlays(this.state, false, false, shouldUpdateOverlays);
		} else if (gameEvent.type === GameEvent.GAME_END) {
			this.updateOverlays(this.state, true, false, shouldUpdateOverlays);
		} else if (gameEvent.type === GameEvent.SCENE_CHANGED) {
			console.log('[game-state] handling overlay for event', gameEvent.type, gameEvent);
			this.onGameScreen = gameEvent.additionalData.scene === 'scene_gameplay';
			this.updateOverlays(this.state, false, false, shouldUpdateOverlays);
		}

		// Delay all "card played" and "secret played" events to give Counterspell a chance to apply first
		// Only do so when a secret has been played to avoid impacting the overall experience
		// To test - Counterspell played first, then Spellbender
		// play spell on a minion, that is countered. Spellbender does not trigger, but shouldn't be grayed out
		let requeueingEventForSecrets = false;
		if (
			allowRequeue &&
			(this.state.playerDeck.secrets.length > 0 || this.state.opponentDeck.secrets.length > 0) &&
			[GameEvent.CARD_PLAYED || GameEvent.SECRET_PLAYED || GameEvent.QUEST_PLAYED].indexOf(gameEvent.type) !== -1
		) {
			const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
			const isPlayer = controllerId === localPlayer.PlayerId;
			const card = this.allCards.getCard(cardId);
			// Only spells are used to delay secret guess
			if (!card || card.type?.toUpperCase() === 'SPELL') {
				// Consider the opposing secrets
				if (
					(isPlayer && this.hasPossibleCounterspell(this.state.opponentDeck.secrets)) ||
					(!isPlayer && this.hasPossibleCounterspell(this.state.playerDeck.secrets))
				) {
					console.log(
						'[game-state] delaying secret elimination to account for a possible Counterspell',
						cardId,
						card,
						isPlayer,
						this.state.playerDeck.secrets.length,
						this.state.opponentDeck.secrets.length,
					);
					setTimeout(
						() =>
							this.processingQueue.enqueue(
								Object.assign(new GameEvent(), gameEvent, { preventRequeue: true }),
							),
						7500,
					);
					requeueingEventForSecrets = true;
				}
			}
		}

		// console.log('\tready to apply secrets parser');
		if (!requeueingEventForSecrets) {
			this.state = await this.secretsParser.parseSecrets(this.state, gameEvent);
		}
		// console.log('\thas applied secrets parser');

		if (allowRequeue) {
			const prefs = await this.prefs.getPreferences();
			for (const parser of this.eventParsers) {
				try {
					if (parser.applies(gameEvent, this.state, prefs)) {
						this.state = await parser.parse(this.state, gameEvent);
					}
				} catch (e) {
					console.error(
						'[game-state] Exception while applying parser',
						parser.event(),
						e.message,
						e.stack,
						e,
					);
				}
			}
		}
		// console.log('\thas applied other parsers');
		try {
			if (this.state) {
				// Add information that is not linked to events, like the number of turns the
				// card has been present in the zone
				const updatedPlayerDeck = this.updateDeck(
					this.state.playerDeck,
					this.state,
					(gameEvent.gameState || ({} as any)).Player,
				);
				const udpatedOpponentDeck = this.updateDeck(
					this.state.opponentDeck,
					this.state,
					(gameEvent.gameState || ({} as any)).Opponent,
				);
				this.state = Object.assign(new GameState(), this.state, {
					playerDeck: updatedPlayerDeck,
					opponentDeck: udpatedOpponentDeck,
				} as GameState);
			}
		} catch (e) {
			console.error('[game-state] Could not update players decks', gameEvent.type, e.message, e.stack, e);
		}
		// console.log('\tready to emit event');
		// console.log('[game-state] will emit event', gameEvent.type, this.state);
		this.updateOverlays(
			this.state,
			false,
			false, //[GameEvent.MATCH_METADATA, GameEvent.LOCAL_PLAYER].indexOf(gameEvent.type) !== -1,
			shouldUpdateOverlays,
		);
		const emittedEvent = {
			event: {
				name: gameEvent.type,
			},
			state: this.state,
		};
		this.eventEmitters.forEach(emitter => emitter(emittedEvent));
		// console.log('processed', gameEvent.type, 'in', Date.now() - this.previousStart);
		this.previousStart = Date.now();
	}

	private hasPossibleCounterspell(secrets: readonly BoardSecret[]) {
		return (
			secrets.length > 0 &&
			secrets.some(secret =>
				secret.allPossibleOptions.some(option => option.cardId === CardIds.Collectible.Mage.Counterspell),
			)
		);
	}

	private updateDeck(deck: DeckState, gameState: GameState, playerFromTracker): DeckState {
		const stateWithMetaInfos = this.gameStateMetaInfos.updateDeck(deck, gameState.currentTurn);
		// Add missing info like card names, if the card added doesn't come from a deck state
		// (like with the Chess brawl)
		const newState = this.deckCardService.fillMissingCardInfoInDeck(stateWithMetaInfos);
		const playerDeckWithDynamicZones = this.dynamicZoneHelper.fillDynamicZones(newState);
		const playerDeckWithZonesOrdered = this.zoneOrdering.orderZones(playerDeckWithDynamicZones, playerFromTracker);
		const totalAttackOnBoard = deck.board
			.map(card => playerFromTracker?.Board?.find(entity => entity.entityId === card.entityId))
			.filter(entity => entity)
			.filter(entity => this.canAttack(entity, deck.isActivePlayer))
			.map(entity => this.windfuryMultiplier(entity) * (entity.attack > 0 ? entity.attack : 0))
			.reduce((a, b) => a + b, 0);
		// console.log(
		// 	'total attack on board',
		// 	playerFromTracker?.Board,
		// 	deck,
		// 	deck.board
		// 		.map(card => playerFromTracker?.Board?.find(entity => entity.entityId === card.entityId))
		// 		.filter(entity => entity && entity.attack > 0)
		// 		.filter(entity => !this.hasTag(entity, GameTag.DORMANT)),
		// );
		const heroAttack =
			this.windfuryMultiplier(playerFromTracker?.Hero) *
			(this.canAttack(playerFromTracker?.Hero, deck.isActivePlayer)
				? Math.max(playerFromTracker?.Hero?.attack, 0) +
				  (deck.isActivePlayer ? 0 : Math.max(playerFromTracker?.Weapon?.attack, 0))
				: 0);
		// console.log('heroAttack', playerFromTracker?.Hero, this.canAttack(playerFromTracker?.Hero));
		return playerDeckWithZonesOrdered && playerFromTracker
			? playerDeckWithZonesOrdered.update({
					cardsLeftInDeck: playerFromTracker.Deck ? playerFromTracker.Deck.length : null,
					totalAttackOnBoard: {
						board: totalAttackOnBoard,
						hero: heroAttack,
					} as AttackOnBoard,
			  } as DeckState)
			: playerDeckWithZonesOrdered;
	}

	private windfuryMultiplier(entity): number {
		if (this.hasTag(entity, GameTag.MEGA_WINDFURY) || this.hasTag(entity, GameTag.WINDFURY, 3)) {
			return 4;
		}
		if (this.hasTag(entity, GameTag.WINDFURY)) {
			return 2;
		}
		return 1;
	}

	private async updateOverlays(
		state: GameState,
		shouldForceCloseSecretsHelper = false,
		forceLogs = false,
		updateOverlays = true,
	) {
		if (!updateOverlays) {
			return;
		}
		if (!this.ow) {
			console.log('ow not defined, returning');
			return;
		}
		await Promise.all(
			this.overlayHandlers.map(handler =>
				handler.updateOverlay(
					state,
					this.showDecktrackerFromGameMode,
					shouldForceCloseSecretsHelper,
					forceLogs,
				),
			),
		);
	}

	private async handleDisplayPreferences(preferences: Preferences = null) {
		preferences = preferences || (await this.prefs.getPreferences());
		this.overlayHandlers.forEach(handler => handler.handleDisplayPreferences(preferences));
		// this.showOpponentTracker = preferences.opponentTracker;
		// console.log('update opp hand prefs', this.showOpponentHand, preferences);
		this.updateOverlays(this.state);
	}

	private async buildEventEmitters() {
		const result = [event => this.deckEventBus.next(event)];
		const prefs = await this.prefs.getPreferences();
		console.log('is logged in to Twitch?', prefs.twitchAccessToken);
		if (prefs.twitchAccessToken) {
			const isTokenValid = await this.twitch.validateToken(prefs.twitchAccessToken);
			if (!isTokenValid) {
				this.prefs.setTwitchAccessToken(undefined);
				await this.twitch.sendExpiredTwitchTokenNotification();
			} else {
				result.push(event => this.twitch.emitDeckEvent(event));
			}
		}
		this.eventEmitters = result;
	}

	private buildOverlayHandlers() {
		this.overlayHandlers = [
			new PlayerDeckOverlayHandler(this.ow),
			new OpponentDeckOverlayHandler(this.ow),
			new OpponentHandOverlayHandler(this.ow),
			new SecretsHelperOverlayHandler(this.ow),
			new GalakroundPlayerCounterOverlayHandler(this.ow, this.allCards),
			new GalakroundOpponentCounterOverlayHandler(this.ow, this.allCards),
			new PogoPlayerCounterOverlayHandler(this.ow, this.allCards),
			new PogoOpponentCounterOverlayHandler(this.ow, this.allCards),
			new AttackPlayerCounterOverlayHandler(this.ow, this.allCards),
			new AttackOpponentCounterOverlayHandler(this.ow, this.allCards),
			new JadeGolemPlayerCounterOverlayHandler(this.ow, this.allCards),
			new JadeGolemOpponentCounterOverlayHandler(this.ow, this.allCards),
			new CthunPlayerCounterOverlayHandler(this.ow, this.allCards),
			new CthunOpponentCounterOverlayHandler(this.ow, this.allCards),
			new FatiguePlayerCounterOverlayHandler(this.ow, this.allCards),
			new FatigueOpponentCounterOverlayHandler(this.ow, this.allCards),
		];
	}

	private buildEventParsers(): readonly EventParser[] {
		return [
			new GameStartParser(this.deckParser, this.prefs, this.allCards),
			new MatchMetadataParser(this.deckParser, this.prefs, this.allCards),
			new MulliganOverParser(),
			new MainStepReadyParser(),
			new CardDrawParser(this.helper),
			new ReceiveCardInHandParser(this.helper, this.allCards),
			new CardBackToDeckParser(this.helper, this.allCards),
			new CreateCardInDeckParser(this.helper, this.allCards),
			new CardRemovedFromDeckParser(this.helper),
			new CardRemovedFromHandParser(this.helper),
			new CardRemovedFromBoardParser(this.helper),
			new CardChangedOnBoardParser(this.helper, this.allCards),
			new CardChangedInHandParser(this.helper, this.allCards),
			new CardChangedInDeckParser(this.helper, this.allCards),
			new CardPlayedFromHandParser(this.helper, this.allCards),
			new MinionSummonedFromHandParser(this.helper, this.allCards),
			new SecretPlayedFromHandParser(this.helper, this.secretsConfig),
			new EndOfEchoInHandParser(this.helper),
			new GameEndParser(this.prefs, this.deckParser),
			new DiscardedCardParser(this.helper),
			new CardRecruitedParser(this.helper),
			new MinionBackOnBoardParser(this.helper),
			new MinionSummonedParser(this.helper, this.allCards),
			new CardRevealedParser(this.helper, this.allCards),
			new MinionDiedParser(this.helper),
			new BurnedCardParser(this.helper),
			new SecretPlayedFromDeckParser(this.helper, this.secretsConfig),
			new SecretCreatedInGameParser(this.helper, this.secretsConfig, this.allCards),
			new SecretDestroyedParser(this.helper),
			new NewTurnParser(),
			new FirstPlayerParser(),
			new CardStolenParser(this.helper, this.allCards),
			new CardCreatorChangedParser(this.helper),
			new AssignCardIdParser(this.helper),
			new HeroPowerChangedParser(this.helper, this.allCards),
			new WeaponEquippedParser(this.helper, this.allCards),
			new WeaponDestroyedParser(),
			new DeckstringOverrideParser(this.deckParser, this.allCards),
			new LocalPlayerParser(this.allCards),
			new OpponentPlayerParser(this.aiDecks, this.deckParser, this.helper, this.allCards, this.prefs),
			new DecklistUpdateParser(this.aiDecks, this.deckParser, this.prefs),
			new CardOnBoardAtGameStart(this.helper, this.allCards),
			new GameRunningParser(this.deckParser),
			new SecretTriggeredParser(this.helper),
			new QuestCreatedInGameParser(this.helper, this.allCards),
			new QuestDestroyedParser(),
			new QuestPlayedFromDeckParser(this.helper),
			new QuestPlayedFromHandParser(this.helper),
			new MinionOnBoardAttackUpdatedParser(this.helper),
			new GalakrondInvokedParser(),
			new PogoPlayedParser(),
			new JadeGolemParser(),
			new CthunParser(),
			new CardBuffedInHandParser(this.helper, this.allCards),
			new MinionGoDormantParser(this.helper),
			new FatigueParser(),
			new EntityUpdateParser(this.helper, this.allCards),
			new PassiveTriggeredParser(this.helper, this.allCards),
			new DamageTakenParser(),
		];
	}

	// On the opponent's turn, we show the total attack, except for dormant minions
	private canAttack(entity, isActivePlayer: boolean): boolean {
		const impossibleToAttack =
			this.hasTag(entity, GameTag.DORMANT) ||
			(isActivePlayer &&
				this.hasTag(entity, GameTag.EXHAUSTED) &&
				!this.hasTag(entity, GameTag.ATTACKABLE_BY_RUSH)) ||
			// Here technically it's not totally correct, as you'd have to know if the
			// frozen minion will unfreeze in the opponent's turn
			(isActivePlayer && this.hasTag(entity, GameTag.FROZEN)) ||
			(isActivePlayer && this.hasTag(entity, GameTag.CANT_ATTACK));
		// console.log(
		// 	'can attack?',
		// 	!impossibleToAttack,
		// 	entity.cardId,
		// 	this.hasTag(entity, GameTag.EXHAUSTED),
		// 	this.hasTag(entity, GameTag.ATTACKABLE_BY_RUSH),
		// 	entity,
		// );
		// charge / rush?
		return !impossibleToAttack;
	}

	private hasTag(entity, tag: number, value = 1): boolean {
		if (!entity?.tags) {
			return false;
		}
		const matches = entity.tags.some(t => t.Name === tag && t.Value === value);
		return matches;
	}
}
