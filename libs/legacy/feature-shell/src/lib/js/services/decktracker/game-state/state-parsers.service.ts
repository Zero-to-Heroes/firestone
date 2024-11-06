import { Injectable } from '@angular/core';
import { DeckHandlerService } from '@firestone/game-state';
import { MemoryInspectionService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { CardsFacadeService, OwUtilsService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { DuelsDecksProviderService } from '../../duels/duels-decks-provider.service';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { AiDeckService } from '../ai-deck-service.service';
import { ConstructedArchetypeServiceOrchestrator } from '../constructed-archetype-orchestrator.service';
import { DeckParserService } from '../deck-parser.service';
import { AnomalyRevealedParser } from '../event-parser/anomaly-revealed-parser';
import {
	ArchetypeCategorizationEvent,
	ArchetypeCategorizationParser,
} from '../event-parser/archetype-categorization-parser';
import { AssignCardIdParser } from '../event-parser/assign-card-ids-parser';
import { AttackParser } from '../event-parser/attack-parser';
import { BgsHeroSelectedCardParser } from '../event-parser/bgs-hero-selected-card-parser';
import { BgsRewardDestroyedParser } from '../event-parser/bgs-reward-destroyed-parser';
import { BgsRewardEquippedParser } from '../event-parser/bgs-reward-equipped-parser';
import { BurnedCardParser } from '../event-parser/burned-card-parser';
import { CardBackToDeckParser } from '../event-parser/card-back-to-deck-parser';
import { CardBuffedInHandParser } from '../event-parser/card-buffed-in-hand-parser';
import { CardChangedInHandParser } from '../event-parser/card-changed-in-hand-parser';
import { CardChangedOnBoardParser } from '../event-parser/card-changed-on-board-parser';
import { CardCreatorChangedParser } from '../event-parser/card-creator-changed-parser';
import { CardDrawParser } from '../event-parser/card-draw-parser';
import { CardDredgedParser } from '../event-parser/card-dredged-parser';
import { CardForgedParser } from '../event-parser/card-forged-parser';
import { CardOnBoardAtGameStart } from '../event-parser/card-on-board-at-game-start-parser';
import { CardPlayedByEffectParser } from '../event-parser/card-played-by-effect';
import { CardPlayedFromHandParser } from '../event-parser/card-played-from-hand-parser';
import { CardRecruitedParser } from '../event-parser/card-recruited-parser';
import { CardRemovedFromBoardParser } from '../event-parser/card-removed-from-board-parser';
import { CardRemovedFromDeckParser } from '../event-parser/card-removed-from-deck-parser';
import { CardRemovedFromHandParser } from '../event-parser/card-removed-from-hand-parser';
import { CardRemovedFromHistoryParser } from '../event-parser/card-removed-from-history-parser';
import { CardRevealedParser } from '../event-parser/card-revealed-parser';
import { CardStolenParser } from '../event-parser/card-stolen-parser';
import { CardTradedParser } from '../event-parser/card-traded-parser';
import { ChoosingOptionsParser } from '../event-parser/choosing-options-parser';
import { ListCardsPlayedFromInitialDeckParser } from '../event-parser/constructed/list-cards-played-from-initial-deck-parser';
import { CopiedFromEntityIdParser } from '../event-parser/copied-from-entity-id-parser';
import { CorpsesSpentThisGameParser } from '../event-parser/corpses-spent-this-game-parser';
import { CostChangedParser } from '../event-parser/cost-changed-parser';
import { CreateCardInDeckParser } from '../event-parser/create-card-in-deck-parser';
import { CreateCardInGraveyardParser } from '../event-parser/create-card-in-graveyard-parser';
import { CustomEffects2Parser } from '../event-parser/custom-effects-2-parser';
import { CustomEffectsParser } from '../event-parser/custom-effects-parser';
import { DamageTakenParser } from '../event-parser/damage-taken-parser';
import { DataScriptChangedParser } from '../event-parser/data-script-changed-parser';
import { DeathrattleTriggeredParser } from '../event-parser/deathrattle-triggered-parser';
import { DeckManipulationHelper } from '../event-parser/deck-manipulation-helper';
import { DecklistUpdateParser } from '../event-parser/decklist-update-parser';
import { DeckstringOverrideParser } from '../event-parser/deckstring-override-parser';
import { DiscardedCardParser } from '../event-parser/discarded-card-parser';
import { EnchantmentAttachedParser } from '../event-parser/enchantment-attached-parser';
import { EnchantmentDetachedParser } from '../event-parser/enchantment-detached-parser';
import { EndOfEchoInHandParser } from '../event-parser/end-of-echo-in-hand-parser';
import { EntityChosenParser } from '../event-parser/entity-chosen-parser';
import { EntityUpdateParser } from '../event-parser/entity-update-parser';
import { EventParser } from '../event-parser/event-parser';
import { ExcavateTierParser } from '../event-parser/excavate-tier-parser';
import { FatigueParser } from '../event-parser/fatigue-parser';
import { FirstPlayerParser } from '../event-parser/first-player-parser';
import { GameEndParser } from '../event-parser/game-end-parser';
import { GameRunningParser } from '../event-parser/game-running-parser';
import { GameStartParser } from '../event-parser/game-start-parser';
import { GlobalMinionEffectParser } from '../event-parser/global-minion-effect-parser';
import { HeroChangedParser } from '../event-parser/hero-changed-parser';
import { HeroPowerChangedParser } from '../event-parser/hero-power-changed-parser';
import { HeroPowerDamageParser } from '../event-parser/hero-power-damage-parser';
import { HeroRevealedParser } from '../event-parser/hero-revealed-parser';
import { LinkedEntityParser } from '../event-parser/linked-entity-parser';
import { LocalPlayerParser } from '../event-parser/local-player-parser';
import { LocationDestroyedParser } from '../event-parser/location-destroyed-parser';
import { LocationUsedParser } from '../event-parser/location-used-parser';
import { MainStepReadyParser } from '../event-parser/main-step-ready-parser';
import { MatchMetadataParser } from '../event-parser/match-metadata-parser';
import { MinionBackOnBoardParser } from '../event-parser/minion-back-on-board-parser';
import { MinionDiedParser } from '../event-parser/minion-died-parser';
import { MinionGoDormantParser } from '../event-parser/minion-go-dormant-parser';
import { MinionOnBoardAttackUpdatedParser } from '../event-parser/minion-on-board-attack-updated-parser';
import { MinionSummonedFromHandParser } from '../event-parser/minion-summoned-from-hand-parser';
import { MinionSummonedParser } from '../event-parser/minion-summoned-parser';
import { MulliganOverParser } from '../event-parser/mulligan-over-parser';
import { NewTurnParser } from '../event-parser/new-turn-parser';
import { OpponentPlayerParser } from '../event-parser/opponent-player-parser';
import { OverloadParser } from '../event-parser/overload-parser';
import { PassiveTriggeredParser } from '../event-parser/passive-triggered-parser';
import { PlayersInfoParser } from '../event-parser/players-info-parser';
import { QuestCompletedParser } from '../event-parser/quest-completed-parser';
import { QuestCreatedInGameParser } from '../event-parser/quest-created-in-game-parser';
import { QuestDestroyedParser } from '../event-parser/quest-destroyed-parser';
import { QuestPlayedFromDeckParser } from '../event-parser/quest-played-from-deck-parser';
import { QuestPlayedFromHandParser } from '../event-parser/quest-played-from-hand-parser';
import { ReceiveCardInHandParser } from '../event-parser/receive-card-in-hand-parser';
import { ReconnectOverParser } from '../event-parser/reconnect-over-parser';
import { ReconnectStartParser } from '../event-parser/reconnect-start-parser';
import { ResourcesParser } from '../event-parser/resources-parser';
import { SecretCreatedInGameParser } from '../event-parser/secret-created-in-game-parser';
import { SecretDestroyedParser } from '../event-parser/secret-destroyed-parser';
import { SecretPlayedFromDeckParser } from '../event-parser/secret-played-from-deck-parser';
import { SecretPlayedFromHandParser } from '../event-parser/secret-played-from-hand-parser';
import { SecretTriggeredParser } from '../event-parser/secret-triggered-parser';
import { SecretWillTriggerParser } from '../event-parser/secret-will-trigger-parser';
import { ShuffleDeckParser } from '../event-parser/shuffle-deck-parser';
import { SpecialCardPowerTriggeredParser } from '../event-parser/special-card-power-triggered-parser';
import { CthunParser } from '../event-parser/special-cases/cthun-parser';
import { CthunRevealedParser } from '../event-parser/special-cases/cthun-revealed-parser';
import { GalakrondInvokedParser } from '../event-parser/special-cases/galakrond-invoked-parser';
import { JadeGolemParser } from '../event-parser/special-cases/jade-golem-parser';
import { PlaguesParser } from '../event-parser/special-cases/plagues-parser';
import { PogoPlayedParser } from '../event-parser/special-cases/pogo-played-parser';
import { SpecificSummonsParser } from '../event-parser/special-cases/specific-summons-parser';
import { SphereOfSapienceParser } from '../event-parser/special-cases/sphere-of-sapience-parser';
import { WheelOfDeathCounterUpdatedParser } from '../event-parser/special-cases/wheel-of-death-counter-updated-parser';
import { StartOfGameEffectParser } from '../event-parser/start-of-game-effect-parser';
import { TouristRevealedParser } from '../event-parser/tourist-revealed-parser';
import { TurnDurationUpdatedParser } from '../event-parser/turn-duration-updated-parser';
import { WeaponDestroyedParser } from '../event-parser/weapon-destroyed-parser';
import { WeaponEquippedParser } from '../event-parser/weapon-equipped-parser';
import { WhizbangDeckParser } from '../event-parser/whizbang-deck-id-parser';
import { SecretConfigService } from '../secret-config.service';

@Injectable()
export class GameStateParsersService {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly aiDecks: AiDeckService,
		private readonly deckHandler: DeckHandlerService,
		private readonly memory: MemoryInspectionService,
		private readonly owUtils: OwUtilsService,
		private readonly prefs: PreferencesService,
		private readonly deckParser: DeckParserService,
		private readonly duelsRunService: DuelsDecksProviderService,
		private readonly secretsConfig: SecretConfigService,
		private readonly constructedArchetypes: ConstructedArchetypeServiceOrchestrator,
	) {}

	public buildEventParsers(): { [eventKey: string]: readonly EventParser[] } {
		return {
			[GameEvent.ANOMALY_REVEALED]: [new AnomalyRevealedParser(this.helper, this.allCards, this.i18n)],
			[ArchetypeCategorizationEvent.EVENT_NAME]: [new ArchetypeCategorizationParser()],
			[GameEvent.ATTACKING_HERO]: [new AttackParser(this.allCards)],
			[GameEvent.ATTACKING_MINION]: [new AttackParser(this.allCards)],
			[GameEvent.BATTLEGROUNDS_HERO_SELECTED]: [new BgsHeroSelectedCardParser(this.helper)],
			[GameEvent.BATTLEGROUNDS_QUEST_REWARD_DESTROYED]: [new BgsRewardDestroyedParser(this.allCards, this.i18n)],
			[GameEvent.BATTLEGROUNDS_REWARD_REVEALED]: [new BgsRewardEquippedParser(this.allCards, this.i18n)],
			[GameEvent.BURNED_CARD]: [new BurnedCardParser(this.helper, this.allCards)],
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
			[GameEvent.CARD_FORGED]: [new CardForgedParser(this.helper)],
			[GameEvent.CARD_ON_BOARD_AT_GAME_START]: [new CardOnBoardAtGameStart(this.helper, this.allCards)],
			[GameEvent.CARD_PLAYED_BY_EFFECT]: [new CardPlayedByEffectParser(this.helper, this.allCards, this.i18n)],
			[GameEvent.CARD_PLAYED]: [
				new CardPlayedFromHandParser(this.helper, this.allCards, this.i18n),
				new PogoPlayedParser(),
				new SpecificSummonsParser(this.allCards),
				new ListCardsPlayedFromInitialDeckParser(this.helper, this.allCards),
			],
			[GameEvent.CARD_REMOVED_FROM_BOARD]: [new CardRemovedFromBoardParser(this.helper)],
			[GameEvent.CARD_REMOVED_FROM_DECK]: [new CardRemovedFromDeckParser(this.helper, this.allCards)],
			[GameEvent.CARD_REMOVED_FROM_HAND]: [new CardRemovedFromHandParser(this.helper, this.allCards)],
			[GameEvent.REMOVE_FROM_HISTORY]: [new CardRemovedFromHistoryParser(this.helper)],
			[GameEvent.CARD_REVEALED]: [new CardRevealedParser(this.helper, this.allCards, this.i18n)],
			[GameEvent.CARD_STOLEN]: [new CardStolenParser(this.helper, this.i18n)],
			[GameEvent.CHOOSING_OPTIONS]: [new ChoosingOptionsParser()],
			[GameEvent.COPIED_FROM_ENTITY_ID]: [new CopiedFromEntityIdParser(this.helper, this.i18n, this.allCards)],
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
			[GameEvent.ENCHANTMENT_ATTACHED]: [new EnchantmentAttachedParser(this.helper, this.allCards)],
			[GameEvent.ENCHANTMENT_DETACHED]: [new EnchantmentDetachedParser(this.helper, this.allCards)],
			[GameEvent.ENTITY_CHOSEN]: [
				new EntityChosenParser(this.helper, this.allCards),
				new SphereOfSapienceParser(this.helper),
			],
			[GameEvent.ENTITY_UPDATE]: [new EntityUpdateParser(this.helper, this.i18n, this.allCards)],
			[GameEvent.EXCAVATE_TIER_CHANGED]: [new ExcavateTierParser()],
			[GameEvent.FATIGUE_DAMAGE]: [new FatigueParser()],
			[GameEvent.FIRST_PLAYER]: [new FirstPlayerParser()],
			[GameEvent.GALAKROND_INVOKED]: [new GalakrondInvokedParser()],
			[GameEvent.GAME_END]: [new GameEndParser(this.prefs, this.owUtils)],
			[GameEvent.GAME_RUNNING]: [new GameRunningParser(this.deckHandler)],
			[GameEvent.GAME_START]: [new GameStartParser()],
			[GameEvent.HEALING]: [new AssignCardIdParser(this.helper)],
			[GameEvent.HERO_CHANGED]: [new HeroChangedParser(this.allCards)],
			[GameEvent.HERO_POWER_CHANGED]: [
				new HeroPowerChangedParser(this.allCards, this.i18n, this.duelsRunService),
			],
			[GameEvent.HERO_REVEALED]: [new HeroRevealedParser(this.allCards)],
			[GameEvent.JADE_GOLEM]: [new JadeGolemParser()],
			[GameEvent.LINKED_ENTITY]: [new LinkedEntityParser(this.helper, this.i18n)],
			[GameEvent.LOCAL_PLAYER]: [new LocalPlayerParser(this.allCards, this.deckParser, this.deckHandler)],
			[GameEvent.LOCATION_USED]: [new LocationUsedParser(this.allCards)],
			[GameEvent.LOCATION_DESTROYED]: [new LocationDestroyedParser(this.helper)],
			[GameEvent.MAIN_STEP_READY]: [new MainStepReadyParser(this.allCards)],
			[GameEvent.MATCH_INFO]: [new PlayersInfoParser()],
			[GameEvent.MATCH_METADATA]: [
				new MatchMetadataParser(
					this.deckParser,
					this.prefs,
					this.deckHandler,
					this.allCards,
					this.memory,
					this.constructedArchetypes,
				),
			],
			[GameEvent.MINION_BACK_ON_BOARD]: [new MinionBackOnBoardParser(this.helper)],
			[GameEvent.MINION_GO_DORMANT]: [new MinionGoDormantParser(this.helper)],
			[GameEvent.MINION_ON_BOARD_ATTACK_UPDATED]: [new MinionOnBoardAttackUpdatedParser(this.helper)],
			[GameEvent.MINION_SUMMONED_FROM_HAND]: [
				new MinionSummonedFromHandParser(this.helper, this.allCards, this.i18n),
				new SpecificSummonsParser(this.allCards),
			],
			[GameEvent.MINION_SUMMONED]: [
				new MinionSummonedParser(this.helper, this.allCards, this.i18n),
				new SpecificSummonsParser(this.allCards),
			],
			[GameEvent.MINIONS_DIED]: [new MinionDiedParser(this.helper, this.allCards)],
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
					this.deckParser,
				),
			],
			[GameEvent.OVERLOADED_CRYSTALS_CHANGED]: [new OverloadParser()],
			[GameEvent.PASSIVE_BUFF]: [new PassiveTriggeredParser(this.helper, this.allCards, this.i18n)],
			[GameEvent.QUEST_COMPLETED]: [new QuestCompletedParser(this.helper)],
			[GameEvent.QUEST_CREATED_IN_GAME]: [new QuestCreatedInGameParser(this.helper, this.allCards, this.i18n)],
			[GameEvent.QUEST_DESTROYED]: [new QuestDestroyedParser(this.helper)],
			[GameEvent.QUEST_PLAYED_FROM_DECK]: [
				new QuestPlayedFromDeckParser(this.helper),
				new ListCardsPlayedFromInitialDeckParser(this.helper, this.allCards),
			],
			[GameEvent.QUEST_PLAYED]: [
				new QuestPlayedFromHandParser(this.helper, this.allCards),
				new ListCardsPlayedFromInitialDeckParser(this.helper, this.allCards),
			],
			[GameEvent.RECEIVE_CARD_IN_HAND]: [new ReceiveCardInHandParser(this.helper, this.allCards, this.i18n)],
			[GameEvent.RECONNECT_OVER]: [new ReconnectOverParser(this.deckHandler)],
			[GameEvent.RECONNECT_START]: [new ReconnectStartParser()],
			[GameEvent.RECRUIT_CARD]: [new CardRecruitedParser(this.helper, this.allCards, this.i18n)],
			[GameEvent.RESOURCES_UPDATED]: [new ResourcesParser()],
			[GameEvent.SECRET_CREATED_IN_GAME]: [
				new SecretCreatedInGameParser(this.helper, this.secretsConfig, this.allCards, this.i18n),
			],
			[GameEvent.SECRET_DESTROYED]: [new SecretDestroyedParser(this.helper)],
			[GameEvent.SECRET_PLAYED_FROM_DECK]: [
				new SecretPlayedFromDeckParser(this.helper, this.secretsConfig),
				new ListCardsPlayedFromInitialDeckParser(this.helper, this.allCards),
			],
			[GameEvent.SECRET_PLAYED]: [
				new SecretPlayedFromHandParser(this.helper, this.secretsConfig, this.allCards, this.i18n),
				new ListCardsPlayedFromInitialDeckParser(this.helper, this.allCards),
			],
			[GameEvent.SECRET_PUT_IN_PLAY]: [
				new SecretPlayedFromHandParser(this.helper, this.secretsConfig, this.allCards, this.i18n),
				new ListCardsPlayedFromInitialDeckParser(this.helper, this.allCards),
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
			[GameEvent.TOURIST_REVEALED]: [new TouristRevealedParser(this.helper, this.allCards, this.i18n)],
			[GameEvent.TRADE_CARD]: [new CardTradedParser(this.helper, this.prefs)],
			[GameEvent.TURN_DURATION_UPDATED]: [new TurnDurationUpdatedParser()],
			[GameEvent.TURN_START]: [new NewTurnParser(this.owUtils, this.prefs)],
			[GameEvent.WEAPON_DESTROYED]: [new WeaponDestroyedParser(this.helper)],
			[GameEvent.WEAPON_EQUIPPED]: [new WeaponEquippedParser(this.allCards, this.helper, this.i18n)],
			[GameEvent.WHEEL_OF_DEATH_COUNTER_UPDATED]: [new WheelOfDeathCounterUpdatedParser()],
			[GameEvent.WHIZBANG_DECK_ID]: [new WhizbangDeckParser(this.deckParser, this.deckHandler)],
			// [GameEvent.MINDRENDER_ILLUCIA_END]: [new  MindrenderIlluciaParser(),],
			// [GameEvent.MINDRENDER_ILLUCIA_START]: [new  MindrenderIlluciaParser(),],
		};
	}
}
