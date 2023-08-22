import { EventEmitter, Injectable } from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { AttackParser } from '@legacy-import/src/lib/js/services/decktracker/event-parser/attack-parser';
import { CustomEffects2Parser } from '@legacy-import/src/lib/js/services/decktracker/event-parser/custom-effects-2-parser';
import { AttackOnBoardService, hasTag } from '@services/decktracker/attack-on-board.service';
import { EntityChosenParser } from '@services/decktracker/event-parser/entity-chosen-parser';
import { HeroRevealedParser } from '@services/decktracker/event-parser/hero-revealed-parser';
import { ReconnectStartParser } from '@services/decktracker/event-parser/reconnect-start-parser';
import { ShuffleDeckParser } from '@services/decktracker/event-parser/shuffle-deck-parser';
import { SpecialCardPowerTriggeredParser } from '@services/decktracker/event-parser/special-card-power-triggered-parser';
import { SphereOfSapienceParser } from '@services/decktracker/event-parser/special-cases/sphere-of-sapience-parser';
import { BehaviorSubject } from 'rxjs';
import { DeckCard } from '../../models/decktracker/deck-card';
import { DeckState } from '../../models/decktracker/deck-state';
import { GameState } from '../../models/decktracker/game-state';
import { GameStateEvent } from '../../models/decktracker/game-state-event';
import { HeroCard } from '../../models/decktracker/hero-card';
import { GameEvent, PlayerGameState } from '../../models/game-event';
import { MinionsDiedEvent } from '../../models/mainwindow/game-events/minions-died-event';
import { Events } from '../events.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { LocalizationFacadeService } from '../localization-facade.service';
import { TwitchAuthService } from '../mainwindow/twitch-auth.service';
import { MercenariesStateBuilderService } from '../mercenaries/mercenaries-state-builder.service';
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
import { BgsRewardDestroyedParser } from './event-parser/bgs-reward-destroyed-parser';
import { BgsRewardEquippedParser } from './event-parser/bgs-reward-equipped-parser';
import { BurnedCardParser } from './event-parser/burned-card-parser';
import { CardBackToDeckParser } from './event-parser/card-back-to-deck-parser';
import { CardBuffedInHandParser } from './event-parser/card-buffed-in-hand-parser';
import { CardChangedInHandParser } from './event-parser/card-changed-in-hand-parser';
import { CardChangedOnBoardParser } from './event-parser/card-changed-on-board-parser';
import { CardCreatorChangedParser } from './event-parser/card-creator-changed-parser';
import { CardDrawParser } from './event-parser/card-draw-parser';
import { CardDredgedParser } from './event-parser/card-dredged-parser';
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
import { ChoosingOptionsParser } from './event-parser/choosing-options-parser';
import { CopiedFromEntityIdParser } from './event-parser/copied-from-entity-id-parser';
import { CorpsesSpentThisGameParser } from './event-parser/corpses-spent-this-game-parser';
import { CostChangedParser } from './event-parser/cost-changed-parser';
import { CreateCardInDeckParser } from './event-parser/create-card-in-deck-parser';
import { CreateCardInGraveyardParser } from './event-parser/create-card-in-graveyard-parser';
import { CustomEffectsParser } from './event-parser/custom-effects-parser';
import { DamageTakenParser } from './event-parser/damage-taken-parser';
import { DataScriptChangedParser } from './event-parser/data-script-changed-parser';
import { DeathrattleTriggeredParser } from './event-parser/deathrattle-triggered-parser';
import { DeckManipulationHelper } from './event-parser/deck-manipulation-helper';
import { DecklistUpdateParser } from './event-parser/decklist-update-parser';
import { DeckstringOverrideParser } from './event-parser/deckstring-override-parser';
import { DiscardedCardParser } from './event-parser/discarded-card-parser';
import { EndOfEchoInHandParser } from './event-parser/end-of-echo-in-hand-parser';
import { EntityUpdateParser } from './event-parser/entity-update-parser';
import { EventParser } from './event-parser/event-parser';
import { FatigueParser } from './event-parser/fatigue-parser';
import { FirstPlayerParser } from './event-parser/first-player-parser';
import { GameEndParser } from './event-parser/game-end-parser';
import { GameRunningParser } from './event-parser/game-running-parser';
import { GameStartParser } from './event-parser/game-start-parser';
import { GlobalMinionEffectParser } from './event-parser/global-minion-effect-parser';
import { HeroPowerChangedParser } from './event-parser/hero-power-changed-parser';
import { HeroPowerDamageParser } from './event-parser/hero-power-damage-parser';
import { LinkedEntityParser } from './event-parser/linked-entity-parser';
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
import { OverloadParser } from './event-parser/overload-parser';
import { PassiveTriggeredParser } from './event-parser/passive-triggered-parser';
import { PlayersInfoParser } from './event-parser/players-info-parser';
import { QuestCompletedParser } from './event-parser/quest-completed-parser';
import { QuestCreatedInGameParser } from './event-parser/quest-created-in-game-parser';
import { QuestDestroyedParser } from './event-parser/quest-destroyed-parser';
import { QuestPlayedFromDeckParser } from './event-parser/quest-played-from-deck-parser';
import { QuestPlayedFromHandParser } from './event-parser/quest-played-from-hand-parser';
import { ReceiveCardInHandParser } from './event-parser/receive-card-in-hand-parser';
import { ReconnectOverParser } from './event-parser/reconnect-over-parser';
import { ResourcesParser } from './event-parser/resources-parser';
import { SecretCreatedInGameParser } from './event-parser/secret-created-in-game-parser';
import { SecretDestroyedParser } from './event-parser/secret-destroyed-parser';
import { SecretPlayedFromDeckParser } from './event-parser/secret-played-from-deck-parser';
import { SecretPlayedFromHandParser } from './event-parser/secret-played-from-hand-parser';
import { SecretTriggeredParser } from './event-parser/secret-triggered-parser';
import { SecretWillTriggerParser } from './event-parser/secret-will-trigger-parser';
import { SecretsParserService } from './event-parser/secrets/secrets-parser.service';
import { CthunParser } from './event-parser/special-cases/cthun-parser';
import { CthunRevealedParser } from './event-parser/special-cases/cthun-revealed-parser';
import { GalakrondInvokedParser } from './event-parser/special-cases/galakrond-invoked-parser';
import { JadeGolemParser } from './event-parser/special-cases/jade-golem-parser';
import { PlaguesParser } from './event-parser/special-cases/plagues-parser';
import { PogoPlayedParser } from './event-parser/special-cases/pogo-played-parser';
import { SpecificSummonsParser } from './event-parser/special-cases/specific-summons-parser';
import { StartOfGameEffectParser } from './event-parser/start-of-game-effect-parser';
import { TurnDurationUpdatedParser } from './event-parser/turn-duration-updated-parser';
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
	private eventParsers: { [eventKey: string]: readonly EventParser[] };

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
		private readonly attackOnBoardService: AttackOnBoardService,
		private readonly mercenariesStateBuilder: MercenariesStateBuilderService,
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
			const decktrackerDisplayEventBus: BehaviorSubject<boolean> =
				this.ow.getMainWindow().decktrackerDisplayEventBus;
			decktrackerDisplayEventBus.subscribe((event) => {
				if (this.showDecktrackerFromGameMode === event) {
					return;
				}
				this.showDecktrackerFromGameMode = event;
			});
			this.i18n.init();
		});

		if (process.env.NODE_ENV !== 'production') {
			window['gameState'] = () => {
				return this.state;
			};
		}
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
			if (stateUpdateEvents.length > 0) {
				// console.debug('[game-state] processing state update events', stateUpdateEvents, eventsToProcess);
			}
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

		const parsersForEvent = this.eventParsers[event.type] ?? [];
		for (const parser of parsersForEvent) {
			try {
				if (parser.applies(event, this.state)) {
					this.state = await parser.parse(this.state, event);
				}
				// if (!this.state) {
				// 	console.error('[game-state] parser returned null state for non-match event', parser.event());
				// }
			} catch (e) {
				console.error(
					'[game-state] Exception while applying parser for non-match event',
					parser.event(),
					event,
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
		} else if (
			gameEvent.type === GameEvent.SECRET_WILL_TRIGGER ||
			gameEvent.type === GameEvent.COUNTER_WILL_TRIGGER
		) {
			this.secretWillTrigger = {
				cardId: gameEvent.cardId,
				reactingToCardId: gameEvent.additionalData.reactingToCardId,
				reactingToEntityId: gameEvent.additionalData.reactingToEntityId,
			};
			console.log('[game-state] secret will trigger in reaction to', this.secretWillTrigger);
		} else if (gameEvent.type === GameEvent.MINIONS_WILL_DIE) {
			const minionsWillDieEvent = gameEvent as MinionsDiedEvent;
			this.minionsWillDie = [
				...this.minionsWillDie,
				...minionsWillDieEvent.additionalData.deadMinions?.map((minion) => ({
					entityId: minion.EntityId,
					cardId: minion.CardId,
				})),
			];
		}

		this.state = await this.secretsParser.parseSecrets(this.state, gameEvent, {
			secretWillTrigger: this.secretWillTrigger,
			minionsWillDie: this.minionsWillDie,
		});
		const prefs = await this.prefs.getPreferences();
		const parsersForEvent = this.eventParsers[gameEvent.type] ?? [];
		for (const parser of parsersForEvent) {
			try {
				if (parser.applies(gameEvent, this.state, prefs)) {
					this.state = await parser.parse(this.state, gameEvent, {
						secretWillTrigger: this.secretWillTrigger,
						minionsWillDie: this.minionsWillDie,
					});
					// if (!this.state) {
					// 	console.error('[game-state] parser returned null state', parser.event());
					// }
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
			console.debug('[game-state] emitting event', emittedEvent.event.name, gameEvent, emittedEvent.state);
			if (this.state.opponentDeck?.deck.some((c) => c.entityId)) {
				console.warn(
					'[game-state] found some cards with known entityIds in opponents deck',
					this.state.opponentDeck,
				);
			}
			this.eventEmitters.forEach((emitter) => emitter(emittedEvent));
		}

		// We have processed the event for which the secret would trigger
		if (
			gameEvent.type !== GameEvent.SECRET_WILL_TRIGGER &&
			gameEvent.type !== GameEvent.COUNTER_WILL_TRIGGER &&
			// Sometimes these events are sent even if the cost doesn't actually change
			gameEvent.type !== GameEvent.COST_CHANGED &&
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
	private updateDeck(deck: DeckState, gameState: GameState, playerFromTracker: PlayerGameState): DeckState {
		const stateWithMetaInfos = this.gameStateMetaInfos.updateDeck(deck, gameState.currentTurn);
		// Add missing info like card names, if the card added doesn't come from a deck state
		// (like with the Chess brawl)
		const newState = this.deckCardService.fillMissingCardInfoInDeck(stateWithMetaInfos);
		const playerDeckWithDynamicZones = this.dynamicZoneHelper.fillDynamicZones(newState, this.i18n);
		if (!playerFromTracker) {
			return playerDeckWithDynamicZones;
		}

		const playerDeckWithZonesOrdered = this.zoneOrdering.orderZones(playerDeckWithDynamicZones, playerFromTracker);
		const newBoard: readonly DeckCard[] = playerDeckWithZonesOrdered.board.map((card) => {
			const entity = playerFromTracker.Board?.find((entity) => entity.entityId === card.entityId);
			return DeckCard.create({
				...card,
				dormant: hasTag(entity, GameTag.DORMANT),
			} as DeckCard);
		});
		const maxMana = playerFromTracker.Hero.tags?.find((t) => t.Name == GameTag.RESOURCES)?.Value ?? 0;
		const manaSpent = playerFromTracker.Hero.tags?.find((t) => t.Name == GameTag.RESOURCES_USED)?.Value ?? 0;
		const newHero: HeroCard = playerDeckWithZonesOrdered.hero?.update({
			manaLeft: maxMana == null || manaSpent == null ? null : maxMana - manaSpent,
		});
		return playerDeckWithZonesOrdered.update({
			board: newBoard,
			hero: newHero,
			cardsLeftInDeck: playerFromTracker.Deck ? playerFromTracker.Deck.length : null,
			totalAttackOnBoard: this.attackOnBoardService.computeAttackOnBoard(deck, playerFromTracker),
		} as DeckState);
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

	private buildEventParsers(): { [eventKey: string]: readonly EventParser[] } {
		return {
			[GameEvent.ATTACKING_HERO]: [new AttackParser(this.allCards)],
			[GameEvent.ATTACKING_MINION]: [new AttackParser(this.allCards)],
			[GameEvent.BATTLEGROUNDS_HERO_SELECTED]: [new BgsHeroSelectedCardParser(this.helper)],
			[GameEvent.BATTLEGROUNDS_QUEST_REWARD_DESTROYED]: [new BgsRewardDestroyedParser(this.allCards, this.i18n)],
			[GameEvent.BATTLEGROUNDS_REWARD_REVEALED]: [new BgsRewardEquippedParser(this.allCards, this.i18n)],
			[GameEvent.BURNED_CARD]: [new BurnedCardParser(this.helper)],
			[GameEvent.CARD_BACK_TO_DECK]: [new CardBackToDeckParser(this.helper, this.allCards, this.i18n)],
			[GameEvent.CARD_BUFFED_IN_HAND]: [new CardBuffedInHandParser(this.helper)],
			[GameEvent.CARD_CHANGED_IN_HAND]: [new CardChangedInHandParser(this.helper, this.allCards, this.i18n)],
			[GameEvent.CARD_CHANGED_ON_BOARD]: [new CardChangedOnBoardParser(this.helper, this.allCards, this.i18n)],
			[GameEvent.CARD_CREATOR_CHANGED]: [new CardCreatorChangedParser(this.helper)],
			[GameEvent.CARD_DRAW_FROM_DECK]: [
				new CardDrawParser(this.helper, this.allCards, this.i18n),
				new SphereOfSapienceParser(this.helper),
			],
			[GameEvent.CARD_DREDGED]: [new CardDredgedParser(this.helper, this.allCards, this.i18n)],
			[GameEvent.CARD_ON_BOARD_AT_GAME_START]: [new CardOnBoardAtGameStart(this.helper, this.allCards)],
			[GameEvent.CARD_PLAYED_BY_EFFECT]: [new CardPlayedByEffectParser(this.helper, this.allCards, this.i18n)],
			[GameEvent.CARD_PLAYED]: [
				new CardPlayedFromHandParser(this.helper, this.allCards, this.i18n),
				new PogoPlayedParser(),
				new SpecificSummonsParser(),
			],
			[GameEvent.CARD_REMOVED_FROM_BOARD]: [new CardRemovedFromBoardParser(this.helper)],
			[GameEvent.CARD_REMOVED_FROM_DECK]: [new CardRemovedFromDeckParser(this.helper, this.allCards)],
			[GameEvent.CARD_REMOVED_FROM_HAND]: [new CardRemovedFromHandParser(this.helper)],
			[GameEvent.CARD_REVEALED]: [new CardRevealedParser(this.helper, this.allCards, this.i18n)],
			[GameEvent.CARD_STOLEN]: [new CardStolenParser(this.helper, this.i18n)],
			[GameEvent.CHOOSING_OPTIONS]: [new ChoosingOptionsParser()],
			[GameEvent.COPIED_FROM_ENTITY_ID]: [new CopiedFromEntityIdParser(this.helper, this.i18n)],
			[GameEvent.CORPSES_SPENT_THIS_GAME_CHANGED]: [new CorpsesSpentThisGameParser()],
			[GameEvent.COST_CHANGED]: [new CostChangedParser(this.helper)],
			[GameEvent.CREATE_CARD_IN_DECK]: [
				new CreateCardInDeckParser(this.helper, this.allCards, this.i18n),
				new PlaguesParser(),
			],
			[GameEvent.CREATE_CARD_IN_GRAVEYARD]: [
				new CreateCardInGraveyardParser(this.helper, this.allCards, this.i18n),
			],
			[GameEvent.CTHUN]: [new CthunParser()],
			[GameEvent.DAMAGE]: [new DamageTakenParser(), new HeroPowerDamageParser(this.allCards)],
			[GameEvent.DATA_SCRIPT_CHANGED]: [new DataScriptChangedParser(this.helper, this.allCards)],
			[GameEvent.DEATHRATTLE_TRIGGERED]: [new DeathrattleTriggeredParser(this.allCards, this.i18n, this.helper)],
			[GameEvent.DECKLIST_UPDATE]: [
				new DecklistUpdateParser(this.aiDecks, this.deckHandler, this.prefs, this.memory),
			],
			[GameEvent.DECKSTRING_OVERRIDE]: [new DeckstringOverrideParser(this.deckHandler)],
			[GameEvent.DISCARD_CARD]: [new DiscardedCardParser(this.helper)],
			[GameEvent.END_OF_ECHO_IN_HAND]: [new EndOfEchoInHandParser(this.helper)],
			[GameEvent.ENTITY_CHOSEN]: [new EntityChosenParser(this.helper), new SphereOfSapienceParser(this.helper)],
			[GameEvent.ENTITY_UPDATE]: [new EntityUpdateParser(this.helper, this.i18n, this.allCards)],
			[GameEvent.FATIGUE_DAMAGE]: [new FatigueParser()],
			[GameEvent.FIRST_PLAYER]: [new FirstPlayerParser()],
			[GameEvent.GALAKROND_INVOKED]: [new GalakrondInvokedParser()],
			[GameEvent.GAME_END]: [new GameEndParser(this.prefs, this.owUtils)],
			[GameEvent.GAME_RUNNING]: [new GameRunningParser(this.deckHandler)],
			[GameEvent.GAME_START]: [new GameStartParser()],
			[GameEvent.HEALING]: [new AssignCardIdParser(this.helper)],
			[GameEvent.HERO_POWER_CHANGED]: [new HeroPowerChangedParser(this.allCards, this.i18n)],
			[GameEvent.HERO_REVEALED]: [new HeroRevealedParser(this.allCards)],
			[GameEvent.JADE_GOLEM]: [new JadeGolemParser()],
			[GameEvent.LINKED_ENTITY]: [new LinkedEntityParser(this.helper, this.i18n)],
			[GameEvent.LOCAL_PLAYER]: [new LocalPlayerParser(this.allCards)],
			[GameEvent.MAIN_STEP_READY]: [new MainStepReadyParser()],
			[GameEvent.MATCH_INFO]: [new PlayersInfoParser()],
			[GameEvent.MATCH_METADATA]: [
				new MatchMetadataParser(
					this.deckParser,
					this.prefs,
					this.deckHandler,
					this.allCards,
					this.memory,
					this.mercenariesStateBuilder,
				),
			],
			[GameEvent.MINION_BACK_ON_BOARD]: [new MinionBackOnBoardParser(this.helper)],
			[GameEvent.MINION_GO_DORMANT]: [new MinionGoDormantParser(this.helper)],
			[GameEvent.MINION_ON_BOARD_ATTACK_UPDATED]: [new MinionOnBoardAttackUpdatedParser(this.helper)],
			[GameEvent.MINION_SUMMONED_FROM_HAND]: [
				new MinionSummonedFromHandParser(this.helper, this.allCards, this.i18n),
				new SpecificSummonsParser(),
			],
			[GameEvent.MINION_SUMMONED]: [
				new MinionSummonedParser(this.helper, this.allCards, this.i18n),
				new SpecificSummonsParser(),
			],
			[GameEvent.MINIONS_DIED]: [new MinionDiedParser(this.helper)],
			[GameEvent.MULLIGAN_DEALING]: [new MulliganOverParser()],
			[GameEvent.OPPONENT]: [
				new OpponentPlayerParser(
					this.aiDecks,
					this.deckHandler,
					this.helper,
					this.allCards,
					this.prefs,
					this.i18n,
					this.memory,
				),
			],
			[GameEvent.OVERLOADED_CRYSTALS_CHANGED]: [new OverloadParser()],
			[GameEvent.PASSIVE_BUFF]: [new PassiveTriggeredParser(this.helper, this.allCards, this.i18n)],
			[GameEvent.QUEST_COMPLETED]: [new QuestCompletedParser(this.helper)],
			[GameEvent.QUEST_CREATED_IN_GAME]: [new QuestCreatedInGameParser(this.helper, this.allCards, this.i18n)],
			[GameEvent.QUEST_DESTROYED]: [new QuestDestroyedParser(this.helper)],
			[GameEvent.QUEST_PLAYED_FROM_DECK]: [new QuestPlayedFromDeckParser(this.helper)],
			[GameEvent.QUEST_PLAYED]: [new QuestPlayedFromHandParser(this.helper, this.allCards)],
			[GameEvent.RECEIVE_CARD_IN_HAND]: [new ReceiveCardInHandParser(this.helper, this.allCards, this.i18n)],
			[GameEvent.RECONNECT_OVER]: [new ReconnectOverParser(this.deckHandler)],
			[GameEvent.RECONNECT_START]: [new ReconnectStartParser()],
			[GameEvent.RECRUIT_CARD]: [new CardRecruitedParser(this.helper, this.allCards, this.i18n)],
			[GameEvent.RESOURCES_UPDATED]: [new ResourcesParser()],
			[GameEvent.SECRET_CREATED_IN_GAME]: [
				new SecretCreatedInGameParser(this.helper, this.secretsConfig, this.allCards, this.i18n),
			],
			[GameEvent.SECRET_DESTROYED]: [new SecretDestroyedParser(this.helper)],
			[GameEvent.SECRET_PLAYED_FROM_DECK]: [new SecretPlayedFromDeckParser(this.helper, this.secretsConfig)],
			[GameEvent.SECRET_PLAYED]: [new SecretPlayedFromHandParser(this.helper, this.secretsConfig, this.allCards)],
			[GameEvent.SECRET_PUT_IN_PLAY]: [
				new SecretPlayedFromHandParser(this.helper, this.secretsConfig, this.allCards),
			],
			[GameEvent.SECRET_TRIGGERED]: [new SecretTriggeredParser(this.helper)],
			[GameEvent.SECRET_WILL_TRIGGER]: [new SecretWillTriggerParser(this.helper)],
			[GameEvent.SHUFFLE_DECK]: [new ShuffleDeckParser()],
			[GameEvent.SPECIAL_CARD_POWER_TRIGGERED]: [
				new SpecialCardPowerTriggeredParser(this.allCards, this.helper),
				new SphereOfSapienceParser(this.helper),
			],
			[GameEvent.SPECTATING]: [new GameEndParser(this.prefs, this.owUtils)],
			[GameEvent.START_OF_GAME]: [new StartOfGameEffectParser(this.helper, this.allCards, this.i18n)],
			[GameEvent.SUB_SPELL_END]: [new CustomEffects2Parser(this.helper, this.allCards)],
			[GameEvent.SUB_SPELL_START]: [
				new CustomEffectsParser(this.helper),
				new CthunRevealedParser(this.helper, this.allCards, this.i18n),
				new GlobalMinionEffectParser(this.helper, this.allCards, this.i18n),
			],
			[GameEvent.TRADE_CARD]: [new CardTradedParser(this.helper, this.prefs)],
			[GameEvent.TURN_DURATION_UPDATED]: [new TurnDurationUpdatedParser()],
			[GameEvent.TURN_START]: [new NewTurnParser(this.owUtils, this.prefs)],
			[GameEvent.WEAPON_DESTROYED]: [new WeaponDestroyedParser(this.helper)],
			[GameEvent.WEAPON_EQUIPPED]: [new WeaponEquippedParser(this.allCards, this.i18n)],
			[GameEvent.WHIZBANG_DECK_ID]: [new WhizbangDeckParser(this.deckParser, this.deckHandler)],
			// [GameEvent.MINDRENDER_ILLUCIA_END]: [new  MindrenderIlluciaParser(),],
			// [GameEvent.MINDRENDER_ILLUCIA_START]: [new  MindrenderIlluciaParser(),],
		};
	}
}
