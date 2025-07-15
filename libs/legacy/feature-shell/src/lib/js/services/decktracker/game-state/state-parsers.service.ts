import { Injectable } from '@angular/core';
import { BgsBoardHighlighterService, BgsInGameWindowNavigationService } from '@firestone/battlegrounds/common';
import { BgsBattleSimulationService, BgsIntermediateResultsSimGuardianService } from '@firestone/battlegrounds/core';
import { DeckHandlerService, GameUniqueIdService } from '@firestone/game-state';
import { MemoryInspectionService } from '@firestone/memory';
import { BugReportService, LogsUploaderService, PreferencesService } from '@firestone/shared/common/service';
import { CardsFacadeService, OwUtilsService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { AdService } from '../../ad.service';
import { GameEventsEmitterService } from '../../game-events-emitter.service';
import { GameEvents } from '../../game-events.service';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { ReviewIdService } from '../../review-id.service';
import { AiDeckService } from '../ai-deck-service.service';
import { ConstructedArchetypeServiceOrchestrator } from '../constructed-archetype-orchestrator.service';
import { DeckParserService } from '../deck-parser.service';
import { AnomalyRevealedParser } from '../event-parser/anomaly-revealed-parser';
import {
	ArchetypeCategorizationEvent,
	ArchetypeCategorizationParser,
} from '../event-parser/archetype-categorization-parser';
import { ArmorChangedParser } from '../event-parser/armor-changed-parser';
import { AssignCardIdParser } from '../event-parser/assign-card-ids-parser';
import { AttackOnBoardParser } from '../event-parser/attack-on-board-parser';
import { AttackParser } from '../event-parser/attack-parser';
import { BgsActivePlayerBoardProcessParser } from '../event-parser/battlegrounds/bgs-active-player-board-process-parser';
import { BgsActivePlayerBoardTriggerParser } from '../event-parser/battlegrounds/bgs-active-player-board-trigger-parser';
import { BgsArmorChangedParser } from '../event-parser/battlegrounds/bgs-armor-changed-parser';
import { BgsBallerBuffChangedParser } from '../event-parser/battlegrounds/bgs-baller-buff-changed-parser';
import { BgsBattleResultParser } from '../event-parser/battlegrounds/bgs-battle-result-parser';
import { BgsBattleSimulationParser } from '../event-parser/battlegrounds/bgs-battle-simulation-parser';
import { BgsBeetleArmyChangedParser } from '../event-parser/battlegrounds/bgs-beetle-army-changed-parser';
import { BgsBloodGemBuffChangedParser } from '../event-parser/battlegrounds/bgs-blood-gem-changed-parser';
import { BgsBuddyGainedParser } from '../event-parser/battlegrounds/bgs-buddy-gained-parser';
import { BgsCombatStartParser } from '../event-parser/battlegrounds/bgs-combat-start-parser';
import { BgsDamageDealtParser } from '../event-parser/battlegrounds/bgs-damage-dealt-parser';
import { BgsDuoFutureTeammateBoardParser } from '../event-parser/battlegrounds/bgs-duo-future-teammate-board-parser';
import { BgsGlobalInfoUpdateParser } from '../event-parser/battlegrounds/bgs-global-info-update-parser';
import { BgsHeroRerollParser } from '../event-parser/battlegrounds/bgs-hero-reroll-parser';
import { BgsHeroSelectedCardParser } from '../event-parser/battlegrounds/bgs-hero-selected-card-parser';
import { BgsHeroSelectionParser } from '../event-parser/battlegrounds/bgs-hero-selection-parser';
import { BgsLeaderboardPlaceParser } from '../event-parser/battlegrounds/bgs-leaderboard-place-parser';
import { BgsMmrAtStartParser } from '../event-parser/battlegrounds/bgs-mmr-at-start-parser';
import { BgsNextOpponentParser } from '../event-parser/battlegrounds/bgs-next-opponent-parser';
import { BgsOpponentRevealedParser } from '../event-parser/battlegrounds/bgs-opponent-revealed-parser';
import { BgsPlayerBoardParser } from '../event-parser/battlegrounds/bgs-player-board-parser';
import { BgsRealTimeStatsUpdateParser } from '../event-parser/battlegrounds/bgs-real-time-stats-update-parser';
import { BgsRecruitPhaseParser } from '../event-parser/battlegrounds/bgs-recruit-phase-parser';
import { BgsRewardDestroyedParser } from '../event-parser/battlegrounds/bgs-reward-destroyed-parser';
import { BgsRewardEquippedParser } from '../event-parser/battlegrounds/bgs-reward-equipped-parser';
import { BgsRewardGainedParser } from '../event-parser/battlegrounds/bgs-reward-gained-parser';
import { BgsRewardRevealedParser } from '../event-parser/battlegrounds/bgs-reward-revealed-parser';
import { BgsTavernUpdateParser } from '../event-parser/battlegrounds/bgs-tavern-update-parser';
import { BgsTotalMagnetizedChangedParser } from '../event-parser/battlegrounds/bgs-total-magnetized-changed-parser';
import { BgsTrinketSelectedParser } from '../event-parser/battlegrounds/bgs-trinket-selected-parser';
import { BgsTripleParser } from '../event-parser/battlegrounds/bgs-triple-parser';
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
import { CardsShuffledIntoDeckParser } from '../event-parser/cards-shuffled-into-deck-parser';
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
import { GameSettingsParser } from '../event-parser/game-settings-parser';
import { GameStartParser } from '../event-parser/game-start-parser';
import { GameStateUpdateParser } from '../event-parser/game-state-update-parser';
import { GlobalMinionEffectParser } from '../event-parser/global-minion-effect-parser';
import { HeroChangedParser } from '../event-parser/hero-changed-parser';
import { HeroPowerChangedParser } from '../event-parser/hero-power-changed-parser';
import { HeroPowerDamageParser } from '../event-parser/hero-power-damage-parser';
import { HeroPowerUsedParser } from '../event-parser/hero-power-used-parser';
import { HeroRevealedParser } from '../event-parser/hero-revealed-parser';
import { ImmolateChangedParser } from '../event-parser/immolate-changed-parser';
import { LinkedEntityParser } from '../event-parser/linked-entity-parser';
import { LocalPlayerParser } from '../event-parser/local-player-parser';
import { LocationDestroyedParser } from '../event-parser/location-destroyed-parser';
import { LocationUsedParser } from '../event-parser/location-used-parser';
import { MainStepReadyParser } from '../event-parser/main-step-ready-parser';
import { MatchMetadataParser } from '../event-parser/match-metadata-parser';
import { MaxResourcesUpdatedParser } from '../event-parser/max-resources-updated-parser';
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
import { ParentCardChangedParser } from '../event-parser/parent-card-changed-parser';
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
import { ReviewIdParser } from '../event-parser/review-id-parser';
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
import { StarshipLaunchedParser } from '../event-parser/starship-launched-parser';
import { StartOfGameEffectParser } from '../event-parser/start-of-game-effect-parser';
import { TouristRevealedParser } from '../event-parser/tourist-revealed-parser';
import { TurnDurationUpdatedParser } from '../event-parser/turn-duration-updated-parser';
import { WeaponDestroyedParser } from '../event-parser/weapon-destroyed-parser';
import { WeaponEquippedParser } from '../event-parser/weapon-equipped-parser';
import { WhizbangDeckParser } from '../event-parser/whizbang-deck-id-parser';
import { ZonePositionChangedParser } from '../event-parser/zone-position-changed-parser';
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
		private readonly secretsConfig: SecretConfigService,
		private readonly constructedArchetypes: ConstructedArchetypeServiceOrchestrator,
		private readonly gameEventsService: GameEvents,
		private readonly eventsEmitter: GameEventsEmitterService,
		private readonly bugService: BugReportService,
		private readonly logsUploader: LogsUploaderService,
		private readonly simulation: BgsBattleSimulationService,
		private readonly adService: AdService,
		private readonly gameIdService: GameUniqueIdService,
		private readonly guardian: BgsIntermediateResultsSimGuardianService,
		private readonly reviewIdService: ReviewIdService,
		private readonly highlighter: BgsBoardHighlighterService,
		private readonly nav: BgsInGameWindowNavigationService,
	) {}

	public buildEventParsers(): { [eventKey: string]: readonly EventParser[] } {
		return {
			[ArchetypeCategorizationEvent.EVENT_NAME]: [new ArchetypeCategorizationParser()],
			[GameEvent.ANOMALY_REVEALED]: [new AnomalyRevealedParser(this.helper, this.allCards, this.i18n)],
			[GameEvent.ARMOR_CHANGED]: [new ArmorChangedParser(), new BgsArmorChangedParser()],
			[GameEvent.ATTACKING_HERO]: [new AttackParser(this.allCards)],
			[GameEvent.ATTACKING_MINION]: [new AttackParser(this.allCards)],
			[GameEvent.BATTLEGROUNDS_ACTIVE_PLAYER_BOARD]: [new BgsActivePlayerBoardTriggerParser(this.memory)],
			[GameEvent.BATTLEGROUNDS_ACTIVE_PLAYER_BOARD_PROCESS]: [new BgsActivePlayerBoardProcessParser()],
			[GameEvent.BATTLEGROUNDS_BATTLE_RESULT]: [
				new BgsBattleResultParser(
					this.gameEventsService,
					this.prefs,
					this.eventsEmitter,
					this.bugService,
					this.allCards,
				),
			],
			[GameEvent.BATTLEGROUNDS_BATTLE_SIMULATION]: [new BgsBattleSimulationParser(this.allCards)],
			[GameEvent.BATTLEGROUNDS_BUDDY_GAINED]: [new BgsBuddyGainedParser(this.gameEventsService, this.allCards)],
			[GameEvent.BATTLEGROUNDS_COMBAT_START]: [new BgsCombatStartParser()],
			[GameEvent.BATTLEGROUNDS_DUO_FUTURE_TEAMMATE_BOARD]: [new BgsDuoFutureTeammateBoardParser()],
			[GameEvent.BATTLEGROUNDS_GLOBAL_INFO_UPDATE]: [new BgsGlobalInfoUpdateParser(this.allCards)],
			[GameEvent.BATTLEGROUNDS_HERO_REROLL]: [new BgsHeroRerollParser()],
			[GameEvent.BATTLEGROUNDS_HERO_SELECTION]: [
				new BgsHeroSelectionParser(this.prefs, this.owUtils, this.i18n, this.memory),
			],
			[GameEvent.BATTLEGROUNDS_HERO_SELECTED]: [
				new BgsHeroSelectedCardParser(this.helper, this.allCards, this.i18n),
			],
			[GameEvent.BATTLEGROUNDS_LEADERBOARD_PLACE]: [new BgsLeaderboardPlaceParser(this.allCards)],
			[GameEvent.BATTLEGROUNDS_MMR_AT_START]: [new BgsMmrAtStartParser()],
			[GameEvent.BATTLEGROUNDS_NEXT_OPPONENT]: [new BgsNextOpponentParser(this.allCards, this.i18n)],
			[GameEvent.BATTLEGROUNDS_OPPONENT_REVEALED]: [new BgsOpponentRevealedParser(this.allCards)],
			[GameEvent.BATTLEGROUNDS_PLAYER_BOARD]: [
				new BgsPlayerBoardParser(
					this.logsUploader,
					this.memory,
					this.simulation,
					this.allCards,
					this.prefs,
					this.adService,
					this.gameIdService,
					this.guardian,
					this.gameEventsService,
				),
			],
			[GameEvent.BATTLEGROUNDS_QUEST_REWARD_DESTROYED]: [new BgsRewardDestroyedParser(this.allCards, this.i18n)],
			[GameEvent.BATTLEGROUNDS_QUEST_REWARD_EQUIPPED]: [new BgsRewardEquippedParser(this.allCards, this.i18n)],
			[GameEvent.BATTLEGROUNDS_REAL_TIME_STATS_UPDATE]: [new BgsRealTimeStatsUpdateParser(this.i18n)],
			[GameEvent.BATTLEGROUNDS_RECRUIT_PHASE]: [new BgsRecruitPhaseParser(this.owUtils, this.prefs, this.i18n)],
			[GameEvent.BATTLEGROUNDS_REWARD_GAINED]: [new BgsRewardGainedParser(this.allCards)],
			[GameEvent.BATTLEGROUNDS_REWARD_REVEALED]: [new BgsRewardRevealedParser(this.allCards)],
			[GameEvent.BATTLEGROUNDS_TAVERN_UPGRADE]: [
				new BgsTavernUpdateParser(this.gameEventsService, this.allCards),
			],
			[GameEvent.BATTLEGROUNDS_TRINKET_SELECTED]: [new BgsTrinketSelectedParser(this.allCards)],
			[GameEvent.BATTLEGROUNDS_TRIPLE]: [new BgsTripleParser(this.allCards)],
			[GameEvent.BALLER_BUFF_CHANGED]: [new BgsBallerBuffChangedParser()],
			[GameEvent.BEETLE_ARMY_CHANGED]: [new BgsBeetleArmyChangedParser()],
			[GameEvent.BLOOD_GEM_BUFF_CHANGED]: [new BgsBloodGemBuffChangedParser()],
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
			[GameEvent.CARD_REMOVED_FROM_BOARD]: [new CardRemovedFromBoardParser(this.helper, this.allCards)],
			[GameEvent.CARD_REMOVED_FROM_DECK]: [new CardRemovedFromDeckParser(this.helper, this.allCards)],
			[GameEvent.CARD_REMOVED_FROM_HAND]: [new CardRemovedFromHandParser(this.helper, this.allCards)],
			[GameEvent.REMOVE_FROM_HISTORY]: [new CardRemovedFromHistoryParser(this.helper)],
			[GameEvent.CARD_REVEALED]: [new CardRevealedParser(this.helper, this.allCards, this.i18n)],
			[GameEvent.CARD_STOLEN]: [new CardStolenParser(this.helper, this.i18n, this.allCards)],
			[GameEvent.CARDS_SHUFFLED_INTO_DECK]: [new CardsShuffledIntoDeckParser()],
			[GameEvent.CHOOSING_OPTIONS]: [new ChoosingOptionsParser()],
			[GameEvent.COPIED_FROM_ENTITY_ID]: [new CopiedFromEntityIdParser(this.helper, this.i18n, this.allCards)],
			[GameEvent.CORPSES_SPENT_THIS_GAME_CHANGED]: [new CorpsesSpentThisGameParser()],
			[GameEvent.COST_CHANGED]: [new CostChangedParser(this.helper, this.allCards)],
			[GameEvent.CREATE_CARD_IN_DECK]: [
				new CreateCardInDeckParser(this.helper, this.allCards, this.i18n),
				new PlaguesParser(),
			],
			[GameEvent.CREATE_CARD_IN_GRAVEYARD]: [
				new CreateCardInGraveyardParser(this.helper, this.allCards, this.i18n),
			],
			[GameEvent.CTHUN]: [new CthunParser()],
			[GameEvent.DAMAGE]: [
				new DamageTakenParser(),
				new HeroPowerDamageParser(this.allCards),
				new BgsDamageDealtParser(this.allCards),
			],
			[GameEvent.DATA_SCRIPT_CHANGED]: [new DataScriptChangedParser(this.helper, this.allCards)],
			[GameEvent.DEATHRATTLE_TRIGGERED]: [new DeathrattleTriggeredParser(this.allCards, this.i18n, this.helper)],
			[GameEvent.DECKLIST_UPDATE]: [
				new DecklistUpdateParser(this.aiDecks, this.deckHandler, this.prefs, this.memory),
			],
			[GameEvent.DECKSTRING_OVERRIDE]: [new DeckstringOverrideParser(this.deckHandler)],
			[GameEvent.DISCARD_CARD]: [new DiscardedCardParser(this.helper, this.allCards)],
			[GameEvent.END_OF_ECHO_IN_HAND]: [new EndOfEchoInHandParser(this.helper)],
			[GameEvent.ENCHANTMENT_ATTACHED]: [new EnchantmentAttachedParser(this.helper, this.allCards, this.i18n)],
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
			[GameEvent.GAME_STATE_UPDATE]: [new GameStateUpdateParser()],
			[GameEvent.GAME_START]: [new GameStartParser(this.reviewIdService, this.nav)],
			[GameEvent.GAME_SETTINGS]: [new GameSettingsParser()],
			[GameEvent.HEALING]: [new AssignCardIdParser(this.helper)],
			[GameEvent.HERO_CHANGED]: [new HeroChangedParser(this.allCards)],
			[GameEvent.HERO_POWER_CHANGED]: [new HeroPowerChangedParser(this.allCards, this.i18n)],
			[GameEvent.HERO_POWER_USED]: [new HeroPowerUsedParser(this.allCards)],
			[GameEvent.HERO_REVEALED]: [new HeroRevealedParser(this.allCards)],
			[GameEvent.IMMOLATE_CHANGED]: [new ImmolateChangedParser(this.helper, this.allCards)],
			[GameEvent.JADE_GOLEM]: [new JadeGolemParser()],
			[GameEvent.LINKED_ENTITY]: [new LinkedEntityParser(this.helper, this.i18n, this.allCards)],
			[GameEvent.LOCAL_PLAYER]: [new LocalPlayerParser(this.allCards, this.deckParser, this.deckHandler)],
			[GameEvent.LOCATION_USED]: [new LocationUsedParser(this.allCards)],
			[GameEvent.LOCATION_DESTROYED]: [new LocationDestroyedParser(this.helper, this.allCards)],
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
					this.nav,
					this.highlighter,
					this.i18n,
				),
			],
			[GameEvent.MAX_RESOURCES_UPDATED]: [new MaxResourcesUpdatedParser()],
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
			[GameEvent.PARENT_CARD_CHANGED]: [new ParentCardChangedParser(this.helper, this.allCards)],
			[GameEvent.PASSIVE_BUFF]: [new PassiveTriggeredParser(this.helper, this.allCards, this.i18n)],
			[GameEvent.QUEST_COMPLETED]: [new QuestCompletedParser(this.helper, this.allCards)],
			[GameEvent.QUEST_CREATED_IN_GAME]: [new QuestCreatedInGameParser(this.helper, this.allCards, this.i18n)],
			[GameEvent.QUEST_DESTROYED]: [new QuestDestroyedParser(this.helper, this.allCards)],
			[GameEvent.QUEST_PLAYED_FROM_DECK]: [
				new QuestPlayedFromDeckParser(this.helper, this.allCards),
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
			[GameEvent.REVIEW_ID]: [new ReviewIdParser()],
			[GameEvent.SECRET_CREATED_IN_GAME]: [
				new SecretCreatedInGameParser(this.helper, this.secretsConfig, this.allCards, this.i18n),
			],
			[GameEvent.SECRET_DESTROYED]: [new SecretDestroyedParser(this.helper)],
			[GameEvent.SECRET_PLAYED_FROM_DECK]: [
				new SecretPlayedFromDeckParser(this.helper, this.secretsConfig, this.allCards),
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
			[GameEvent.STARSHIP_LAUNCHED]: [new StarshipLaunchedParser(this.helper)],
			[GameEvent.START_OF_GAME]: [new StartOfGameEffectParser(this.helper, this.allCards, this.i18n)],
			[GameEvent.SUB_SPELL_END]: [new CustomEffects2Parser(this.helper, this.allCards)],
			[GameEvent.SUB_SPELL_START]: [
				new CustomEffectsParser(this.helper, this.allCards),
				new CthunRevealedParser(this.helper, this.allCards, this.i18n),
				new GlobalMinionEffectParser(this.helper, this.allCards, this.i18n),
			],
			[GameEvent.TOTAL_ATTACK_ON_BOARD]: [new AttackOnBoardParser()],
			[GameEvent.TOTAL_MAGNETIZE_CHANGED]: [new BgsTotalMagnetizedChangedParser()],
			[GameEvent.TOURIST_REVEALED]: [new TouristRevealedParser(this.helper, this.allCards, this.i18n)],
			[GameEvent.TRADE_CARD]: [new CardTradedParser(this.helper, this.prefs)],
			[GameEvent.TURN_DURATION_UPDATED]: [new TurnDurationUpdatedParser()],
			[GameEvent.TURN_START]: [new NewTurnParser(this.owUtils, this.prefs, this.i18n, this.nav)],
			[GameEvent.WEAPON_DESTROYED]: [new WeaponDestroyedParser(this.helper)],
			[GameEvent.WEAPON_EQUIPPED]: [new WeaponEquippedParser(this.allCards, this.helper, this.i18n)],
			[GameEvent.WHEEL_OF_DEATH_COUNTER_UPDATED]: [new WheelOfDeathCounterUpdatedParser()],
			[GameEvent.WHIZBANG_DECK_ID]: [new WhizbangDeckParser(this.deckParser, this.deckHandler)],
			[GameEvent.ZONE_POSITION_CHANGED]: [new ZonePositionChangedParser(this.helper)],
			// [GameEvent.MINDRENDER_ILLUCIA_END]: [new  MindrenderIlluciaParser(),],
			// [GameEvent.MINDRENDER_ILLUCIA_START]: [new  MindrenderIlluciaParser(),],
		};
	}
}
