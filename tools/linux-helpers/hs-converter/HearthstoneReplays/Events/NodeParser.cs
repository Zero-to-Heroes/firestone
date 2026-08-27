#region
using System;
using System.Timers;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using HearthstoneReplays.Parser;
using HearthstoneReplays.Events.Parsers;
using HearthstoneReplays.Events.Parsers.Controls;
#endregion

namespace HearthstoneReplays.Events
{
    public class NodeParser
    {
        private EventQueueHandler QueueHandler { get; set; }
        private StateFacade StateFacade { get; set; }
        private ParserState ParserState { get; set; }
        private StateType StateType { get; set; }

        private ControlsManager Controller { get; set; }

        private List<ActionParser> _parsers;
        private List<ActionParser> parsers { 
            get {
                if (_parsers != null)
                {
                    return _parsers;
                }
                if (ParserState == null)
                {
                    return new List<ActionParser>();
                }
                if (StateFacade?.GsState?.CurrentGame?.GameType == null || ParserState == null || StateFacade?.GsState?.CurrentGame?.GameType == -1)
                {
                    // For NEW_GAME event
                    return BuildActionParsers(ParserState, StateType);
                }
                var allParsers = BuildActionParsers(ParserState, StateType);
                this._parsers = allParsers
                    .Where(p => Controller.Applies(p))
                    .ToList();
                return this._parsers;
            } 
        }

        // Feed it the PTL parser, as it's the latest one to get the meta data
        public NodeParser(EventQueueHandler queueHandler, StateFacade stateFacade, StateType stateType)
        {
            QueueHandler = queueHandler;
            StateFacade = stateFacade;
            StateType = stateType;
            Controller = new ControlsManager(stateFacade, stateType);
        }

        public void Reset(ParserState ParserState, StateFacade helper)
        {
            this.StateFacade = helper;
            this.ParserState = ParserState;
            this.QueueHandler.Reset(StateFacade);
            this._parsers = null;
        }

        public void NewNode(Node node, StateType stateType)
        {
            if (node == null)
            {
                return;
            }
            foreach (ActionParser parser in parsers)
            {
                if (parser.AppliesOnNewNode(node, stateType))
                {
                    try
                    {
                        List<GameEventProvider> providers = parser.CreateGameEventProviderFromNew(node);
                        if (providers != null)
                        {
                            EnqueueGameEvent(providers);
                        }
                    }
                    catch (Exception e)
                    {
                        Logger.Log("ERROR: Exception while parsing node", e.Message);
                        Logger.Log(node.CreationLogLine, "");
                        Logger.Log(e.StackTrace.ToString(), "");
                    }
                }
            }
        }

        public void CloseNode(Node node, StateType stateType)
        {
            if (node == null)
            {
                return;
            }
            foreach (ActionParser parser in parsers)
            {
                if (!node.Closed && parser.AppliesOnCloseNode(node, stateType))
                {
                    try
                    {
                        List<GameEventProvider> providers = parser.CreateGameEventProviderFromClose(node);
                        if (providers != null && providers.Count > 0)
                        {
                            EnqueueGameEvent(providers);
                        }
                    }
                    catch (Exception e)
                    {
                        Logger.Log("ERROR: Exception while parsing node", e.Message);
                        Logger.Log(node.CreationLogLine, "");
                        Logger.Log(e.StackTrace.ToString(), "");
                    }
                }
            }
            // Make sure we don't process the same node twice
            node.Closed = true;
        }

        public void EnqueueGameEvent(List<GameEventProvider> providers)
        {
            QueueHandler.EnqueueGameEvent(providers);
        }

        public void ClearQueue()
        {
            QueueHandler.ClearQueue();
        }

        private List<ActionParser> BuildActionParsers(ParserState ParserState, StateType stateType)
        {
            if (stateType == StateType.GameState)
            {
                return new List<ActionParser>()
                {
                    new NewGameParser(ParserState, StateFacade),
                    new TurnCleanupParser(ParserState, StateFacade),
                    new GameCleanupParser(ParserState, StateFacade),
                    new SecretWillTriggeredParser(ParserState, StateFacade),
                    new CounterWillTriggerParser(ParserState, StateFacade),
                    new MinionsWillDieParser(ParserState, StateFacade),
                    new ChoosingOptionsParser(ParserState, StateFacade),
                    // Will parse the GameState logs (because choices are logged only in GS), but uses the PTL states
                    new EntityChosenParser(ParserState, StateFacade),

                    new BattlegroundsHeroSelectedParser(ParserState, StateFacade),
                    new BattlegroundsDuoTeammatePlayerBoardParser(ParserState, StateFacade),
                    //new BattlegroundsBattleStartingParser(ParserState, StateFacade),
                    new BattlegroundsActivePlayerBoardParser(ParserState, StateFacade),
                    new BattlegroundsPlayerBoardParser(ParserState, StateFacade),
                };
            }
            else
            {
                return new List<ActionParser>()
                {
                    new GameResetParser(ParserState, StateFacade),

                    // Ordering is important,
                    new HideEntityParser(ParserState, StateFacade),
                    new ShowEntityParser(ParserState, StateFacade),
                    new FullEntityParser(ParserState, StateFacade),

                    // we want to have "ability revealed" before 
                    // "ability updated" (done by the EntityUpdateParser). Same with CardRevealed
                    // Also, MINION_SUMMONED need to happen before any Equipment / Ability revealed
                    new MinionSummonedParser(ParserState, StateFacade),

                    new CardRevealedParser(ParserState, StateFacade),

                    new MercenariesHeroRevealed(ParserState, StateFacade),
                    new MercenariesAbilityRevealedParser(ParserState, StateFacade),
                    new MercenariesAbilityActivatedParser(ParserState, StateFacade),
                    new MercenariesAbilityCooldownUpdatedParser(ParserState, StateFacade),
                    new MercenariesQueuedAbilityParser(ParserState, StateFacade),
                    new MercenariesSelectedTargetParser(ParserState, StateFacade),

                    new BattlegroundsPlayerBoardParser(ParserState, StateFacade),
                    new ShuffleDeckParser(ParserState, StateFacade),

                    new WinnerParser(ParserState, StateFacade),
                    new GameEndParser(ParserState, StateFacade),
                    new TurnStartParser(ParserState, StateFacade),
                    new FirstPlayerParser(ParserState, StateFacade),
                    new MainStepReadyParser(ParserState),
                    new CardPlayedFromHandParser(ParserState, StateFacade),
                    new CardPlayedFromEffectParser(ParserState, StateFacade),
                    new SecretPlayedFromHandParser(ParserState, StateFacade),
                    new MulliganInputParser(ParserState),
                    new MulliganDealingParser(ParserState),
                    new MulliganDoneParser(ParserState),
                    new RumbleRunStepParser(ParserState, StateFacade),
                    new DungeonRunStepParser(ParserState, StateFacade),
                    new MonsterRunStepParser(ParserState, StateFacade),
                    new PassiveBuffParser(ParserState, StateFacade),
                    new CardPresentOnGameStartParser(ParserState, StateFacade),
                    new CardDrawFromDeckParser(ParserState, StateFacade),
                    new ReceiveCardInHandParser(ParserState, StateFacade),
                    new CardBackToDeckParser(ParserState, StateFacade),
                    new CardTradedParser(ParserState, StateFacade),
                    new DiscardedCardParser(ParserState, StateFacade),
                    new CardRemovedFromDeckParser(ParserState, StateFacade),
                    new CreateCardInDeckParser(ParserState, StateFacade),
                    new EndOfEchoInHandParser(ParserState, StateFacade),
                    new CardChangedParser(ParserState, StateFacade),
                    new CardUpdatedInDeckParser(ParserState, StateFacade),
                    new CardRemovedFromHandParser(ParserState, StateFacade),
                    new CardRemovedFromBoardParser(ParserState, StateFacade),
                    new MinionOnBoardAttackUpdatedParser(ParserState, StateFacade),
                    new RecruitParser(ParserState, StateFacade),
                    new MinionBackOnBoardParser(ParserState, StateFacade),
                    new HeroRevealedParser(ParserState, StateFacade),
                    new InitialCardInDeckParser(ParserState, StateFacade),
                    new FatigueParser(ParserState, StateFacade),
                    new DamageParser(ParserState, StateFacade),
                    new HealingParser(ParserState, StateFacade),
                    new BurnedCardParser(ParserState, StateFacade),
                    new RemovedFromHistoryParser(ParserState, StateFacade),
                    new MinionDiedParser(ParserState, StateFacade),
                    new SecretPlayedFromDeckParser(ParserState, StateFacade),
                    new SecretCreatedInGameParser(ParserState, StateFacade),
                    new SecretDestroyedParser(ParserState, StateFacade),
                    new ArmorChangeParser(ParserState, StateFacade),
                    new CorpsesChangedParser(ParserState, StateFacade),
                    new HeraldColossalAmountParser(ParserState, StateFacade),
                    new MaxResourcesChangedParser(ParserState, StateFacade),
                    new ExcavateTierChangedParser(ParserState, StateFacade),
                    new CardStolenParser(ParserState, StateFacade),
                    new SecretTriggeredParser(ParserState, StateFacade),
                    new CounterTriggerParser(ParserState, StateFacade),
                    new QuestCompletedParser(ParserState, StateFacade),
                    new DeathrattleTriggeredParser(ParserState, StateFacade),
                    new HealthDefChangeParser(ParserState, StateFacade),
                    new ChangeCardCreatorParser(ParserState, StateFacade),
                    new LocalPlayerLeaderboardPlaceChangedParser(ParserState, StateFacade),
                    new HeroPowerChangedParser(ParserState, StateFacade),
                    new HeroChangedParser(ParserState, StateFacade),
                    new WeaponEquippedParser(ParserState, StateFacade),
                    new WeaponDestroyedParser(ParserState, StateFacade),
                    new LocationDestroyedParser(ParserState, StateFacade),
                    new HeroEnchantmentAttachedParser(ParserState, StateFacade),
                    new HeroEnchantmentDetachedParser(ParserState, StateFacade),
                    new CardsShuffledIntoDeckParser(ParserState, StateFacade),

                    new BattlegroundsPlayerTechLevelUpdatedParser(ParserState, StateFacade),
                    new BattlegroundsBuddyGainedParser(ParserState, StateFacade),
                    new BattlegroundsQuestRevealedParser(ParserState, StateFacade),
                    new BattlegroundsQuestCompletedParser(ParserState, StateFacade),
                    new BattlegroundsRewardGainedParser(ParserState, StateFacade),
                    new BattlegroundsPlayerLeaderboardPlaceUpdatedParser(ParserState, StateFacade),
                    new BattlegroundsHeroSelectionParser(ParserState, StateFacade),
                    new BattlegroundsHeroRerollParser(ParserState, StateFacade),
                    new BattlegroundsNextOpponnentParser(ParserState),
                    new BattlegroundsTriplesCountUpdatedParser(ParserState, StateFacade),
                    //new BattlegroundsStartOfCombatParser(ParserState),
                    //new BattlegroundsAfterPlayerBoardsRevealedParser(ParserState, StateFacade),
                    new BattlegroundsOpponentRevealedParser(ParserState, StateFacade),
                    new BattlegroundsHeroSelectedParser(ParserState, StateFacade),
                    new BattlegroundsBattleOverParser(ParserState, StateFacade),
                    new BattlegroundsRerollParser(ParserState, StateFacade),
                    new BattlegroundFreezeParser(ParserState, StateFacade),
                    new BattlegroundsMinionsBoughtParser(ParserState, StateFacade),
                    new BattlegroundsMinionsSoldParser(ParserState, StateFacade),
                    new BattlegroundsHeroKilledParser(ParserState, StateFacade),
                    new BattlegroundsQuestRewardEquippedParser(ParserState, StateFacade),
                    new BattlegroundsQuestRewardDestroyedParser(ParserState, StateFacade),
                    new BloodGemBuffChangedParser(ParserState, StateFacade),
                    new BeetleArmyChangedParser(ParserState, StateFacade),
                    new BallerBuffChangedParser(ParserState, StateFacade),
                    new TotalMagnetizeChangedParser(ParserState, StateFacade),
                    //new BattlegroundsExtraGoldNextTurnParser(ParserState, StateFacade),
                    new BattlegroundsTrinketSelectedParser(ParserState, StateFacade),
                    new BattlegroundsTrinketSelectionParser(ParserState, StateFacade),
                    new BattlegroundsTimewarpedTavernActiveParser(ParserState, StateFacade),

                    new DecklistUpdateParser(ParserState, StateFacade),
                    new GameRunningParser(ParserState, StateFacade),
                    new AttackParser(ParserState, StateFacade),
                    new NumCardsPlayedThisTurnParser(ParserState, StateFacade),
                    new NumCardsDrawnThisTurnParser(ParserState, StateFacade),
                    new HeroPowerUsedParser(ParserState, StateFacade),
                    new GalakrondInvokedParser(ParserState, StateFacade),
                    new CardBuffedInHandParser(ParserState, StateFacade),
                    new MinionGoDormantParser(ParserState, StateFacade),
                    new AttackOnBoardParser(ParserState, StateFacade),
                    new JadeGolemParser(ParserState, StateFacade),
                    new CthunParser(ParserState, StateFacade),
                    new EntityUpdateParser(ParserState, StateFacade),
                    //new ResourcesThisTurnParser(ParserState, StateFacade),
                    new ResourcesUsedThisTurnParser(ParserState, StateFacade),
                    new WhizbangDeckParser(ParserState, StateFacade),
                    new BattlegroundsTavernPrizesParser(ParserState),
                    new LinkedEntityParser(ParserState, StateFacade),
                    new ZoneChangeParser(ParserState, StateFacade),
                    new ZonePositionChangedParser(ParserState, StateFacade),
                    new CostChangedParser(ParserState, StateFacade),
                    new SpawnTimeCountChangedParser(ParserState, StateFacade),
                    new TurnDurationUpdateParser(ParserState, StateFacade),
                    new StartOfGameTriggerParser(ParserState, StateFacade),
                    new DataScriptChangedParser(ParserState, StateFacade),
                    new ImmolateChangedParser(ParserState, StateFacade),
                    new OverloadedCrystalsParser(ParserState, StateFacade),
                    new CorposesSpentThisGameParser(ParserState, StateFacade),
                    new ConstructedAnomalyParser(ParserState, StateFacade),
                    new TouristRevealedParser(ParserState, StateFacade),
                    new ParentCardChangedParser(ParserState, StateFacade),
                    new StarshipLaunchedParser(ParserState, StateFacade),


                    new CardForgedParser(ParserState, StateFacade),
                    new LocationUsedParser(ParserState, StateFacade),
                    new CreateCardInGraveyardParser(ParserState, StateFacade),
                    new MindrenderIlluciaParser(ParserState, StateFacade),
                    new SpecialCardPowerParser(ParserState, StateFacade),
                    new WheelOfDeathCounterParser(ParserState, StateFacade),

                    // Needs to happen after EntityUpdate, because somsetimes the event is sent from the 
                    // SHOW_ENTITY block that triggers the ENTITY_UPDATE event
                    new CopiedFromEntityIdParser(ParserState, StateFacade),
                    new SpecialTargetParser(ParserState, StateFacade),
                };
            }
        }
    }
}
