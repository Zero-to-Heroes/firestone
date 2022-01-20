import { EventEmitter, Injectable } from '@angular/core';
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { BehaviorSubject } from 'rxjs';
import { AttackOnBoard } from '../../models/decktracker/attack-on-board';
import { DeckCard } from '../../models/decktracker/deck-card';
import { DeckState } from '../../models/decktracker/deck-state';
import { GameState } from '../../models/decktracker/game-state';
import { GameStateEvent } from '../../models/decktracker/game-state-event';
import { GameEvent } from '../../models/game-event';
import { MinionsDiedEvent } from '../../models/mainwindow/game-events/minions-died-event';
import { Events } from '../events.service';
import { FeatureFlags } from '../feature-flags';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { LocalizationFacadeService } from '../localization-facade.service';
import { TwitchAuthService } from '../mainwindow/twitch-auth.service';
import { OverwolfService } from '../overwolf.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { OwUtilsService } from '../plugins/ow-utils.service';
import { PreferencesService } from '../preferences.service';
import { ProcessingQueue } from '../processing-queue.service';
import { uuid } from '../utils';
import { AiDeckService } from './ai-deck-service.service';
import { DeckCardService } from './deck-card.service';
import { DeckHandlerService } from './deck-handler.service';
import { DeckParserService } from './deck-parser.service';
import { DynamicZoneHelperService } from './dynamic-zone-helper.service';
import { AssignCardIdParser } from './event-parser/assign-card-ids-parser';
import { BgsHeroSelectedCardParser } from './event-parser/bgs-hero-selected-card-parser';
import { BurnedCardParser } from './event-parser/burned-card-parser';
import { CardBackToDeckParser } from './event-parser/card-back-to-deck-parser';
import { CardBuffedInHandParser } from './event-parser/card-buffed-in-hand-parser';
import { CardChangedInDeckParser } from './event-parser/card-changed-in-deck-parser';
import { CardChangedInHandParser } from './event-parser/card-changed-in-hand-parser';
import { CardChangedOnBoardParser } from './event-parser/card-changed-on-board-parser';
import { CardCreatorChangedParser } from './event-parser/card-creator-changed-parser';
import { CardDrawParser } from './event-parser/card-draw-parser';
import { CardOnBoardAtGameStart } from './event-parser/card-on-board-at-game-start-parser';
import { CardPlayedByEffectParser } from './event-parser/card-played-by-effect';
import { CardPlayedFromHandParser } from './event-parser/card-played-from-hand-parser';
import { CardRecruitedParser } from './event-parser/card-recruited-parser';
import { CardRemovedFromBoardParser } from './event-parser/card-removed-from-board-parser';
import { CardRemovedFromDeckParser } from './event-parser/card-removed-from-deck-parser';
import { CardRemovedFromHandParser } from './event-parser/card-removed-from-hand-parser';
import { CardRevealedParser } from './event-parser/card-revealed-parser';
import { CardStolenParser } from './event-parser/card-stolen-parser';
import { CardTradedParser } from './event-parser/card-traded-parser';
import { ConstructedAchievementsProgressionParser } from './event-parser/constructed/constructed-achievements-progression-parser';
import { ConstructedChangeTabParser } from './event-parser/constructed/constructed-change-tab-parser';
import { ListCardsPlayedFromInitialDeckParser } from './event-parser/constructed/list-cards-played-from-initial-deck-parser';
import { CopiedFromEntityIdParser } from './event-parser/copied-from-entity-id-parser';
import { CreateCardInDeckParser } from './event-parser/create-card-in-deck-parser';
import { CreateCardInGraveyardParser } from './event-parser/create-card-in-graveyard-parser';
import { CthunParser } from './event-parser/cthun-parser';
import { CthunRevealedParser } from './event-parser/cthun-revealed-parser';
import { CustomEffectsParser } from './event-parser/custom-effects-parser';
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
import { GlobalMinionEffectParser } from './event-parser/global-minion-effect-parser';
import { HeroPowerChangedParser } from './event-parser/hero-power-changed-parser';
import { HeroPowerDamageParser } from './event-parser/hero-power-damage-parser';
import { JadeGolemParser } from './event-parser/jade-golem-parser';
import { LinkedEntityParser } from './event-parser/linked-entity-parser';
import { LocalPlayerParser } from './event-parser/local-player-parser';
import { MainStepReadyParser } from './event-parser/main-step-ready-parser';
import { MatchMetadataParser } from './event-parser/match-metadata-parser';
import { MindrenderIlluciaParser } from './event-parser/mindrender-illucia-parser';
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
import { PlayersInfoParser } from './event-parser/players-info-parser';
import { PogoPlayedParser } from './event-parser/pogo-played-parser';
import { QuestCreatedInGameParser } from './event-parser/quest-created-in-game-parser';
import { QuestDestroyedParser } from './event-parser/quest-destroyed-parser';
import { QuestPlayedFromDeckParser } from './event-parser/quest-played-from-deck-parser';
import { QuestPlayedFromHandParser } from './event-parser/quest-played-from-hand-parser';
import { ReceiveCardInHandParser } from './event-parser/receive-card-in-hand-parser';
import { ReconnectOverParser } from './event-parser/reconnect-over-parser';
import { SecretCreatedInGameParser } from './event-parser/secret-created-in-game-parser';
import { SecretDestroyedParser } from './event-parser/secret-destroyed-parser';
import { SecretPlayedFromDeckParser } from './event-parser/secret-played-from-deck-parser';
import { SecretPlayedFromHandParser } from './event-parser/secret-played-from-hand-parser';
import { SecretTriggeredParser } from './event-parser/secret-triggered-parser';
import { SecretsParserService } from './event-parser/secrets/secrets-parser.service';
import { WeaponDestroyedParser } from './event-parser/weapon-destroyed-parser';
import { WeaponEquippedParser } from './event-parser/weapon-equipped-parser';
import { WhizbangDeckParser } from './event-parser/whizbang-deck-id-parser';
import { ConstructedAchievementsProgressionEvent } from './event/constructed-achievements-progression-event';
import { GameStateMetaInfoService } from './game-state-meta-info.service';
import { SecretConfigService } from './secret-config.service';
import { ZoneOrderingService } from './zone-ordering.service';

@Injectable()
export class GameStateService {
	public state: GameState = new GameState();
	private eventParsers: readonly EventParser[];

	// Keep a single queue to avoid race conditions between the two queues (since they
	// modify the same state)
	private processingQueue = new ProcessingQueue<GameEvent | GameStateEvent>(
		(eventQueue) => this.processQueue(eventQueue),
		50,
		'game-state',
	);

	// We need to get through a queue to avoid race conditions when two events are close together,
	// so that we're sure teh state is update sequentially
	// private eventQueue: Queue<GameEvent> = new Queue<GameEvent>();
	private deckEventBus = new BehaviorSubject<any>(null);
	private deckUpdater: EventEmitter<GameEvent | GameStateEvent> = new EventEmitter<GameEvent | GameStateEvent>();
	private eventEmitters = [];

	private currentReviewId: string;
	private secretWillTrigger: {
		cardId: string;
		reactingToCardId: string;
		reactingToEntityId: number;
	};
	private minionsWillDie: readonly {
		entityId: number;
		cardId: string;
	}[] = [];

	private showDecktrackerFromGameMode: boolean;

	constructor(
		private gameEvents: GameEventsEmitterService,
		private events: Events,
		private dynamicZoneHelper: DynamicZoneHelperService,
		private gameStateMetaInfos: GameStateMetaInfoService,
		private zoneOrdering: ZoneOrderingService,
		private allCards: CardsFacadeService,
		private prefs: PreferencesService,
		private twitch: TwitchAuthService,
		private deckCardService: DeckCardService,
		private ow: OverwolfService,
		private deckParser: DeckParserService,
		private helper: DeckManipulationHelper,
		private aiDecks: AiDeckService,
		private secretsConfig: SecretConfigService,
		private secretsParser: SecretsParserService,
		private readonly deckHandler: DeckHandlerService,
		private readonly memory: MemoryInspectionService,
		private readonly i18n: LocalizationFacadeService,
		private readonly owUtils: OwUtilsService,
	) {
		this.eventParsers = this.buildEventParsers();
		this.registerGameEvents();
		this.buildEventEmitters();
		if (!this.ow) {
			console.warn('[game-state] Could not find OW service');
			return;
		}
		window['deckEventBus'] = this.deckEventBus;
		window['deckUpdater'] = this.deckUpdater;
		setTimeout(() => {
			const preferencesEventBus: BehaviorSubject<any> = this.ow.getMainWindow().preferencesEventBus;
			preferencesEventBus.subscribe(async (event) => {
				if (event?.name === PreferencesService.TWITCH_CONNECTION_STATUS) {
					this.buildEventEmitters();
					return;
				}
			});
			this.deckUpdater.subscribe((event: GameEvent | GameStateEvent) => {
				this.processingQueue.enqueue(event);
			});
			const decktrackerDisplayEventBus: BehaviorSubject<boolean> = this.ow.getMainWindow()
				.decktrackerDisplayEventBus;
			decktrackerDisplayEventBus.subscribe((event) => {
				if (this.showDecktrackerFromGameMode === event) {
					return;
				}
				this.showDecktrackerFromGameMode = event;
			});
			this.i18n.init();
		});
	}

	// TODO: this should move elsewhere
	public async getCurrentReviewId(): Promise<string> {
		return new Promise<string>((resolve) => this.getCurrentReviewIdInternal((reviewId) => resolve(reviewId)));
	}

	private async getCurrentReviewIdInternal(callback, retriesLeft = 15) {
		if (retriesLeft <= 0) {
			console.error('[game-state] Review ID was never set, assigning new one');
			this.currentReviewId = uuid();
		}
		if (!this.currentReviewId) {
			setTimeout(() => this.getCurrentReviewIdInternal(callback, retriesLeft - 1), 1000);
			return;
		}
		callback(this.currentReviewId);
	}

	private registerGameEvents() {
		this.gameEvents.onGameStart.subscribe((event) => {
			console.log('[game-state] game start event received, resetting currentReviewId');
			this.currentReviewId = uuid();
			console.log('[game-state] built currentReviewId', this.currentReviewId);
			const info = {
				type: 'new-empty-review',
				reviewId: this.currentReviewId,
			};
			this.events.broadcast(Events.REVIEW_INITIALIZED, info);
		});
		this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => {
			this.processingQueue.enqueue(gameEvent);
		});
		this.events
			.on(Events.ACHIEVEMENT_PROGRESSION)
			.subscribe((event) =>
				this.processingQueue.enqueue(new ConstructedAchievementsProgressionEvent(event.data[0])),
			);
		// Reset the deck if it exists
		this.processingQueue.enqueue(Object.assign(new GameEvent(), { type: GameEvent.GAME_END } as GameEvent));
	}

	private async processQueue(eventQueue: readonly (GameEvent | GameStateEvent)[]) {
		try {
			const stateUpdateEvents = eventQueue.filter((event) => event.type === GameEvent.GAME_STATE_UPDATE);
			const eventsToProcess = [
				...eventQueue.filter((event) => event.type !== GameEvent.GAME_STATE_UPDATE),
				stateUpdateEvents.length > 0 ? stateUpdateEvents[stateUpdateEvents.length - 1] : null,
			].filter((event) => event);
			for (let i = 0; i < eventsToProcess.length; i++) {
				if (eventsToProcess[i] instanceof GameEvent) {
					await this.processEvent(eventsToProcess[i] as GameEvent);
				} else {
					await this.processNonMatchEvent(eventsToProcess[i] as GameStateEvent);
				}
			}
		} catch (e) {
			console.error('Exception while processing event', e);
		}
		return [];
	}

	private async processNonMatchEvent(event: GameStateEvent) {
		if (event.type === 'TOGGLE_SECRET_HELPER') {
			this.state = this.state.update({
				opponentDeck: this.state.opponentDeck.update({
					secretHelperActive: !this.state.opponentDeck.secretHelperActive,
				} as DeckState),
			} as GameState);
		} else if (event.type === 'CLOSE_TRACKER') {
			this.state = this.state.update({
				playerTrackerClosedByUser: true,
			});
		} else if (event.type === 'CLOSE_OPPONENT_TRACKER') {
			this.state = this.state.update({
				opponentTrackerClosedByUser: true,
			});
		}

		for (const parser of this.eventParsers) {
			try {
				if (parser.applies(event, this.state)) {
					this.state = await parser.parse(this.state, event);
				}
			} catch (e) {
				console.error(
					'[game-state] Exception while applying parser for non-match event',
					parser.event(),
					e.message,
					e.stack,
					e,
				);
			}
		}

		const emittedEvent = {
			event: {
				name: event.type,
			},
			state: this.state,
		};
		this.eventEmitters.forEach((emitter) => emitter(emittedEvent));
	}

	private async processEvent(gameEvent: GameEvent) {
		if (gameEvent.type === GameEvent.GAME_START) {
			this.state = this.state?.update({
				playerTrackerClosedByUser: false,
				opponentTrackerClosedByUser: false,
			});
		} else if (gameEvent.type === GameEvent.SPECTATING) {
			this.state = this.state?.update({
				// We can't "unspectate" a game
				spectating: this.state.spectating || gameEvent.additionalData.spectating,
			} as GameState);
		} else if (gameEvent.type === GameEvent.SECRET_WILL_TRIGGER) {
			this.secretWillTrigger = {
				cardId: gameEvent.cardId,
				reactingToCardId: gameEvent.additionalData.reactingToCardId,
				reactingToEntityId: gameEvent.additionalData.reactingToEntityId,
			};
			console.log('[game-state] secret will trigger in reaction to', this.secretWillTrigger);
		} else if (gameEvent.type === GameEvent.MINIONS_WILL_DIE) {
			this.minionsWillDie = [
				...this.minionsWillDie,
				...gameEvent.additionalData.deadMinions?.map((minion) => ({
					entityId: minion.EntityId,
					cardId: minion.CardId,
				})),
			];
			console.log('[game-state] minions will die', this.minionsWillDie);
		}

		this.state = await this.secretsParser.parseSecrets(this.state, gameEvent, {
			secretWillTrigger: this.secretWillTrigger,
			minionsWillDie: this.minionsWillDie,
		});
		const prefs = await this.prefs.getPreferences();
		for (const parser of this.eventParsers) {
			try {
				if (parser.applies(gameEvent, this.state, prefs)) {
					this.state = await parser.parse(this.state, gameEvent, {
						secretWillTrigger: this.secretWillTrigger,
						minionsWillDie: this.minionsWillDie,
					});
				}
			} catch (e) {
				console.error('[game-state] Exception while applying parser', parser.event(), e.message, e.stack, e);
			}
		}
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

		if (this.state) {
			const emittedEvent = {
				event: {
					name: gameEvent.type,
				},
				state: this.state,
			};
			// console.debug('[game-state] emitting event', emittedEvent.event.name, emittedEvent.state);
			this.eventEmitters.forEach((emitter) => emitter(emittedEvent));
		}

		// We have processed the event for which the secret would trigger
		// TODO: how to handle reconnects, where dev mode is active?
		if (
			gameEvent.type !== GameEvent.SECRET_WILL_TRIGGER &&
			((this.secretWillTrigger?.reactingToCardId &&
				this.secretWillTrigger.reactingToCardId === gameEvent.cardId) ||
				(this.secretWillTrigger?.reactingToEntityId &&
					this.secretWillTrigger.reactingToEntityId === gameEvent.entityId))
		) {
			console.log('[game-state] resetting secretWillTrigger', gameEvent.type, this.secretWillTrigger);
			this.secretWillTrigger = null;
		}
		if (this.minionsWillDie?.length && gameEvent.type === GameEvent.MINIONS_DIED) {
			const gEvent = gameEvent as MinionsDiedEvent;
			this.minionsWillDie = this.minionsWillDie.filter(
				(minion) => !gEvent.additionalData.deadMinions.map((m) => m.EntityId).includes(minion.entityId),
			);
		}
	}

	// TODO: this should move elsewhere
	private updateDeck(deck: DeckState, gameState: GameState, playerFromTracker): DeckState {
		const stateWithMetaInfos = this.gameStateMetaInfos.updateDeck(deck, gameState.currentTurn);
		// Add missing info like card names, if the card added doesn't come from a deck state
		// (like with the Chess brawl)
		const newState = this.deckCardService.fillMissingCardInfoInDeck(stateWithMetaInfos);
		const playerDeckWithDynamicZones = this.dynamicZoneHelper.fillDynamicZones(newState);
		if (!playerFromTracker) {
			return playerDeckWithDynamicZones;
		}

		const playerDeckWithZonesOrdered = this.zoneOrdering.orderZones(playerDeckWithDynamicZones, playerFromTracker);
		const newBoard: readonly DeckCard[] = playerDeckWithZonesOrdered.board.map((card) => {
			const entity = playerFromTracker.Board?.find((entity) => entity.entityId === card.entityId);
			return DeckCard.create({
				...card,
				dormant: this.hasTag(entity, GameTag.DORMANT),
			} as DeckCard);
		});
		const numberOfVoidtouchedAttendants =
			newBoard.filter((entity) => entity.cardId === CardIds.VoidtouchedAttendant).length || 0;
		const entitiesOnBoardThatCanAttack = newBoard
			.map((card) => playerFromTracker.Board?.find((entity) => entity.entityId === card.entityId))
			.filter((entity) => entity)
			.filter((entity) => this.canAttack(entity, stateWithMetaInfos.isActivePlayer))
			.filter((entity) => entity.attack > 0);
		const totalAttackOnBoard = entitiesOnBoardThatCanAttack
			.map((entity) => this.windfuryMultiplier(entity) * (numberOfVoidtouchedAttendants + entity.attack))
			.reduce((a, b) => a + b, 0);
		const baseHeroAttack = stateWithMetaInfos.isActivePlayer
			? Math.max(playerFromTracker?.Hero?.attack || 0, 0)
			: Math.max(playerFromTracker?.Weapon?.attack || 0, 0);
		const heroAttack =
			baseHeroAttack > 0 && this.canAttack(playerFromTracker.Hero, stateWithMetaInfos.isActivePlayer)
				? this.windfuryMultiplier(playerFromTracker.Hero) * (numberOfVoidtouchedAttendants + baseHeroAttack)
				: 0;
		return playerDeckWithZonesOrdered.update({
			board: newBoard,
			cardsLeftInDeck: playerFromTracker.Deck ? playerFromTracker.Deck.length : null,
			totalAttackOnBoard: {
				board: totalAttackOnBoard,
				hero: heroAttack,
			} as AttackOnBoard,
		} as DeckState);
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

	private async buildEventEmitters() {
		const result = [(event) => this.deckEventBus.next(event)];
		const prefs = await this.prefs.getPreferences();
		console.log('is logged in to Twitch?', !!prefs.twitchAccessToken);
		if (prefs.twitchAccessToken) {
			const isTokenValid = await this.twitch.validateToken(prefs.twitchAccessToken);
			if (!isTokenValid) {
				this.prefs.setTwitchAccessToken(undefined);
				await this.twitch.sendExpiredTwitchTokenNotification();
			} else {
				result.push((event) => this.twitch.emitDeckEvent(event));
			}
		}
		this.eventEmitters = result;
	}

	private buildEventParsers(): readonly EventParser[] {
		const parsers: EventParser[] = [
			new GameStartParser(),
			new WhizbangDeckParser(this.deckParser, this.deckHandler),
			new MatchMetadataParser(this.deckParser, this.prefs, this.deckHandler, this.allCards),
			new MulliganOverParser(),
			new MainStepReadyParser(),
			new CardDrawParser(this.helper, this.allCards, this.i18n),
			new ReceiveCardInHandParser(this.helper, this.allCards, this.i18n),
			new CardBackToDeckParser(this.helper, this.allCards, this.i18n),
			new CardTradedParser(this.helper, this.allCards, this.i18n),
			new CreateCardInDeckParser(this.helper, this.allCards, this.i18n),
			new CardRemovedFromDeckParser(this.helper),
			new CardRemovedFromHandParser(this.helper),
			new CardRemovedFromBoardParser(this.helper),
			new CardChangedOnBoardParser(this.helper, this.allCards, this.i18n),
			new CardChangedInHandParser(this.helper, this.allCards, this.i18n),
			new CardChangedInDeckParser(this.helper, this.allCards, this.i18n),
			new CardPlayedFromHandParser(this.helper, this.allCards, this.i18n),
			new CardPlayedByEffectParser(this.helper, this.allCards, this.i18n),
			new MinionSummonedFromHandParser(this.helper, this.allCards, this.i18n),
			new SecretPlayedFromHandParser(this.helper, this.secretsConfig),
			new EndOfEchoInHandParser(this.helper),
			new GameEndParser(this.prefs, this.deckParser),
			new DiscardedCardParser(this.helper),
			new BgsHeroSelectedCardParser(this.helper),
			new CardRecruitedParser(this.helper),
			new MinionBackOnBoardParser(this.helper),
			new MinionSummonedParser(this.helper, this.allCards, this.i18n),
			new CardRevealedParser(this.helper, this.allCards, this.i18n),
			new LinkedEntityParser(this.helper, this.i18n),
			new MinionDiedParser(this.helper),
			new BurnedCardParser(this.helper),
			new SecretPlayedFromDeckParser(this.helper, this.secretsConfig),
			new SecretCreatedInGameParser(this.helper, this.secretsConfig, this.allCards, this.i18n),
			new SecretDestroyedParser(this.helper),
			new NewTurnParser(this.owUtils, this.prefs),
			new FirstPlayerParser(),
			new CardStolenParser(this.helper, this.i18n),
			new CardCreatorChangedParser(this.helper),
			new AssignCardIdParser(this.helper),
			new HeroPowerChangedParser(this.allCards, this.i18n),
			new WeaponEquippedParser(this.allCards, this.i18n),
			new WeaponDestroyedParser(),
			new DeckstringOverrideParser(this.deckHandler),
			new LocalPlayerParser(this.allCards),
			new OpponentPlayerParser(this.aiDecks, this.deckHandler, this.helper, this.allCards, this.prefs),
			new PlayersInfoParser(),
			new DecklistUpdateParser(this.aiDecks, this.deckHandler, this.prefs),
			new CardOnBoardAtGameStart(this.helper, this.allCards),
			new GameRunningParser(this.deckHandler),
			new SecretTriggeredParser(this.helper),
			new QuestCreatedInGameParser(this.helper, this.allCards, this.i18n),
			new QuestDestroyedParser(),
			new QuestPlayedFromDeckParser(this.helper),
			new QuestPlayedFromHandParser(this.helper),
			new MinionOnBoardAttackUpdatedParser(this.helper),
			new GalakrondInvokedParser(),
			new PogoPlayedParser(),
			new JadeGolemParser(),
			new CthunParser(),
			new CardBuffedInHandParser(this.helper),
			new CustomEffectsParser(this.helper),
			new MinionGoDormantParser(this.helper),
			new FatigueParser(),
			new EntityUpdateParser(this.helper, this.i18n),
			new PassiveTriggeredParser(this.helper, this.allCards, this.i18n),
			new DamageTakenParser(),
			new HeroPowerDamageParser(this.allCards),
			new CthunRevealedParser(this.helper, this.allCards, this.i18n),
			new MindrenderIlluciaParser(),
			new GlobalMinionEffectParser(this.helper, this.allCards, this.i18n),
			new CopiedFromEntityIdParser(this.helper, this.i18n),

			new CreateCardInGraveyardParser(this.helper, this.allCards, this.i18n),
			new ReconnectOverParser(this.deckHandler),
		];

		if (FeatureFlags.SHOW_CONSTRUCTED_SECONDARY_WINDOW) {
			parsers.push(new ConstructedAchievementsProgressionParser());
			parsers.push(new ConstructedChangeTabParser());
			parsers.push(new ListCardsPlayedFromInitialDeckParser(this.helper));
		}

		return parsers;
	}

	// TODO: this should move elsewhere
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
			this.hasTag(entity, GameTag.CANT_ATTACK);

		// 	'can attack?',
		// 	!impossibleToAttack,
		// 	entity?.cardId,
		// 	this.hasTag(entity, GameTag.EXHAUSTED),
		// 	this.hasTag(entity, GameTag.ATTACKABLE_BY_RUSH),
		// 	this.hasTag(entity, GameTag.CANT_ATTACK),
		// 	entity,
		// );
		// charge / rush?
		return !impossibleToAttack;
	}

	// TODO: this should move elsewhere
	private hasTag(entity, tag: number, value = 1): boolean {
		if (!entity?.tags) {
			return false;
		}
		const matches = entity.tags.some((t) => t.Name === tag && t.Value === value);
		return matches;
	}
}
